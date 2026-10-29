<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\RestaurantsClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;

class OrderController extends Controller
{
    public function __construct(private RestaurantsClient $restaurants) {}

    public function index(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        $query = Order::with('items')->orderByDesc('id');
        if ($user['role'] === 'cliente') $query->where('user_id', $user['id']);
        if ($request->filled('status')) $query->where('status', $request->query('status'));
        return response()->json($query->get());
    }

    public function show(Request $request, int $id)
    {
        $user = $request->attributes->get('auth_user');
        $order = Order::with('items')->find($id);
        if (!$order) return response()->json(['message' => 'Pedido no encontrado'], 404);
        if ($user['role'] === 'cliente' && $order->user_id !== $user['id']) {
            return response()->json(['message' => 'Este pedido no es suyo'], 403);
        }
        return response()->json($order);
    }

    public function store(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        if (!in_array($user['role'], ['cliente', 'admin'])) {
            return response()->json(['message' => 'Se requiere rol: cliente o admin'], 403);
        }
        $data = $request->validate([
            'restaurant_id' => ['required', 'integer', 'min:1'],
            'delivery_address' => ['required', 'string', 'max:200'],
            'notes' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.dish_id' => ['required', 'integer', 'min:1'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        // Primero consultamos los precios reales. No guardamos nada si falla una consulta.
        try {
            $bearer = $request->header('Authorization');
            $restaurant = $this->restaurants->restaurant($data['restaurant_id'], $bearer);
            if (!$restaurant || !$restaurant['active']) {
                return response()->json(['message' => 'El restaurante no existe o no esta activo'], 422);
            }
            $items = [];
            $total = 0;
            foreach ($data['items'] as $line) {
                $dish = $this->restaurants->dish($line['dish_id'], $bearer);
                if (!$dish) return response()->json(['message' => 'El plato no existe'], 422);
                if ((int) $dish['restaurant_id'] !== (int) $data['restaurant_id']) {
                    return response()->json(['message' => 'El plato no pertenece a este restaurante'], 422);
                }
                if (!$dish['available']) return response()->json(['message' => 'El plato no esta disponible'], 422);
                $subtotal = round($dish['price'] * $line['quantity'], 2);
                $total += $subtotal;
                $items[] = ['dish_id' => $dish['id'], 'dish_name' => $dish['name'],
                    'unit_price' => $dish['price'], 'quantity' => $line['quantity'], 'subtotal' => $subtotal];
            }
        } catch (ConnectionException | RequestException $e) {
            return response()->json(['message' => 'No se pudo consultar el servicio restaurants'], 502);
        }

        // La cabecera y el detalle se guardan juntos en PostgreSQL.
        $order = DB::transaction(function () use ($data, $user, $restaurant, $items, $total) {
            $order = Order::create([
                'user_id' => $user['id'], 'user_name' => $user['name'] ?? 'cliente',
                'restaurant_id' => $restaurant['id'], 'restaurant_name' => $restaurant['name'],
                'delivery_address' => $data['delivery_address'], 'notes' => $data['notes'] ?? null,
                'status' => 'pendiente', 'total' => $total,
            ]);
            $order->items()->createMany($items);
            return $order->load('items');
        });
        return response()->json($order, 201);
    }

    public function updateStatus(Request $request, int $id)
    {
        $user = $request->attributes->get('auth_user');
        $statuses = config('delivery.statuses');
        $data = $request->validate(['status' => ['required', Rule::in($statuses)]]);
        $new = $data['status'];
        $order = Order::with('items')->find($id);
        if (!$order) return response()->json(['message' => 'Pedido no encontrado'], 404);

        $allowed = match ($user['role']) {
            'admin' => ['confirmado', 'en_preparacion', 'en_camino', 'entregado', 'cancelado'],
            'repartidor' => ['en_camino', 'entregado'],
            default => ['cancelado'],
        };
        if (!in_array($new, $allowed, true)) {
            return response()->json(['message' => 'Su rol no puede poner ese estado'], 403);
        }
        if ($user['role'] === 'cliente' && ($order->user_id !== $user['id'] || $order->status !== 'pendiente')) {
            return response()->json(['message' => 'Solo puede cancelar sus pedidos pendientes'], 403);
        }
        if (in_array($order->status, ['entregado', 'cancelado'], true)) {
            return response()->json(['message' => 'El pedido ya esta finalizado'], 409);
        }
        if ($new !== 'cancelado' && array_search($new, $statuses) <= array_search($order->status, $statuses)) {
            return response()->json(['message' => "No se puede pasar de $order->status a $new"], 409);
        }
        $updated = Order::where('id', $id)->where('status', $order->status)->update(['status' => $new]);
        if (!$updated) return response()->json(['message' => 'El pedido cambio, vuelva a consultar'], 409);
        return response()->json($order->fresh('items'));
    }

    public function destroy(Request $request, int $id)
    {
        $user = $request->attributes->get('auth_user');
        if ($user['role'] !== 'admin') return response()->json(['message' => 'Se requiere rol: admin'], 403);
        $order = Order::find($id);
        if (!$order) return response()->json(['message' => 'Pedido no encontrado'], 404);
        $order->delete();
        return response()->json(['success' => true, 'message' => 'Pedido eliminado', 'id' => $id]);
    }
}
