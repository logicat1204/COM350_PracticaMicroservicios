<?php
// Pruebas locales: SQLite en memoria y respuestas simuladas de restaurants.
// No modifican las bases de datos de Docker.
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use App\Models\Order;

require __DIR__.'/../serviceOrders/vendor/autoload.php';
$app = require __DIR__.'/../serviceOrders/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();
config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:',
    'delivery.restaurants_url' => 'http://restaurants.test/api/v1']);
Artisan::call('migrate', ['--force' => true]);

$price = 45;
$offline = false;
$forwarded = false;
Http::preventStrayRequests();
Http::fake(function ($request) use (&$price, &$offline, &$forwarded) {
    if ($offline) throw new ConnectionException('Servicio simulado caido');
    $forwarded = str_starts_with($request->header('Authorization')[0] ?? '', 'Bearer ');
    $id = (int) basename(parse_url($request->url(), PHP_URL_PATH));
    if (str_contains($request->url(), '/restaurants/')) {
        return Http::response(['id' => 1, 'name' => 'El Huerto', 'active' => 1]);
    }
    if ($id === 999) return Http::response(['message' => 'No existe'], 404);
    return Http::response(['id' => $id, 'restaurant_id' => $id === 4 ? 2 : 1,
        'name' => 'Plato de prueba', 'price' => $id === 3 ? 25 : $price, 'available' => $id === 5 ? 0 : 1]);
});

function token($role = 'cliente', $id = 'cliente1', $expires = null) {
    $encode = fn ($value) => rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    $header = $encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $body = $encode(json_encode(['id' => $id, 'name' => 'Prueba', 'role' => $role, 'exp' => $expires ?? time() + 600]));
    return "$header.$body.".$encode(hash_hmac('sha256', "$header.$body", config('delivery.jwt_secret'), true));
}
function callApi($method, $path, $data = [], $token = null) {
    global $kernel;
    $server = ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'];
    if ($token !== null) $server['HTTP_AUTHORIZATION'] = 'Bearer '.$token;
    $request = Request::create('/api/v1'.$path, $method, [], [], [], $server, json_encode($data));
    $response = $kernel->handle($request);
    $body = json_decode($response->getContent(), true);
    $kernel->terminate($request, $response);
    return [$response->getStatusCode(), $body];
}
$passed = 0;
function check($condition, $message) {
    global $passed;
    if (!$condition) { fwrite(STDERR, "FALLO: $message\n"); exit(1); }
    echo "OK: $message\n";
    $passed++;
}
$cliente = token();
$admin = token('admin', 'admin1');
$courier = token('repartidor', 'repartidor1');
$body = ['restaurant_id' => 1, 'delivery_address' => 'Calle Junin 100',
    'items' => [['dish_id' => 1, 'quantity' => 2, 'unit_price' => 0.01], ['dish_id' => 3, 'quantity' => 1]]];
check(callApi('GET', '/orders')[0] === 401, 'Sin token: 401');
check(callApi('GET', '/orders', [], token('cliente', 'c1', time() - 1))[0] === 401, 'Token expirado: 401');
check(callApi('GET', '/orders', [], $cliente.'x')[0] === 401, 'Token alterado: 401');
[$code, $order] = callApi('POST', '/orders', $body, $cliente);
check($code === 201 && $order['status'] === 'pendiente', 'Crear pedido pendiente: 201');
$id = $order['id'];
check((float) $order['total'] === 115.0, 'Total real 2 x 45 + 25 = 115, ignora precio del cliente');
check(count($order['items']) === 2 && $forwarded, 'Detalle guardado y Authorization reenviado');
$price = 80;
check((float) callApi('GET', "/orders/$id", [], $cliente)[1]['items'][0]['unit_price'] === 45.0, 'Precio historico conservado');
$invalid = $body; $invalid['items'] = [];
check(callApi('POST', '/orders', $invalid, $cliente)[0] === 422, 'Items vacios: 422 JSON');
foreach ([4 => 'Plato de otro restaurante', 5 => 'Plato no disponible', 999 => 'Plato inexistente'] as $dish => $label) {
    $invalid = $body; $invalid['items'] = [['dish_id' => $dish, 'quantity' => 1]];
    check(callApi('POST', '/orders', $invalid, $cliente)[0] === 422, "$label: 422");
}
check(Order::count() === 1, 'No se guardaron pedidos incompletos');
check(callApi('POST', '/orders', $body, $courier)[0] === 403, 'Repartidor no crea pedidos');
check(callApi('GET', "/orders/$id", [], token('cliente', 'otro'))[0] === 403, 'Cliente ajeno no ve el pedido');
check(count(callApi('GET', '/orders', [], token('cliente', 'otro'))[1]) === 0, 'Lista de cliente filtrada');
check(count(callApi('GET', '/orders', [], $admin)[1]) === 1, 'Admin lista todos');
check(callApi('PATCH', "/orders/$id/status", ['status' => 'confirmado'], $cliente)[0] === 403, 'Cliente no confirma');
check(callApi('PATCH', "/orders/$id/status", ['status' => 'confirmado'], $admin)[0] === 200, 'Admin confirma');
check(callApi('PATCH', "/orders/$id/status", ['status' => 'en_preparacion'], $admin)[0] === 200, 'Admin pasa a preparacion');
check(callApi('PATCH', "/orders/$id/status", ['status' => 'confirmado'], $admin)[0] === 409, 'No retrocede: 409');
check(callApi('PATCH', "/orders/$id/status", ['status' => 'en_camino'], $courier)[0] === 200, 'Repartidor pone en camino');
check(callApi('PATCH', "/orders/$id/status", ['status' => 'entregado'], $courier)[0] === 200, 'Repartidor entrega');
check(callApi('PATCH', "/orders/$id/status", ['status' => 'cancelado'], $admin)[0] === 409, 'Pedido finalizado no cambia');
$offline = true;
check(callApi('POST', '/orders', $body, $cliente)[0] === 502, 'Restaurants caido: 502 sin guardar pedido');
$offline = false;
[$code, $cancel] = callApi('POST', '/orders', $body, $cliente);
check(callApi('PATCH', '/orders/'.$cancel['id'].'/status', ['status' => 'cancelado'], $cliente)[0] === 200, 'Cliente cancela su pendiente');
check(callApi('DELETE', "/orders/$id", [], $cliente)[0] === 403, 'Cliente no elimina');
check(callApi('DELETE', "/orders/$id", [], $admin)[0] === 200, 'Admin elimina');
check(\App\Models\OrderItem::where('order_id', $id)->count() === 0, 'Detalle eliminado en cascada');
echo "\n$passed comprobaciones de orders correctas (SQLite y HTTP simulado).\n";
