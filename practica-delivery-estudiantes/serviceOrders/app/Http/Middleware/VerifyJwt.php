<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifyJwt
{
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');
        if (!str_starts_with($header, 'Bearer ')) {
            return response()->json(['message' => 'Token no proporcionado'], 401);
        }
        $user = $this->decode(substr($header, 7));
        if ($user === null) {
            return response()->json(['message' => 'Token invalido o expirado'], 401);
        }
        $request->attributes->set('auth_user', $user);
        // Mejora C.2: nginx agrega este header cuando se usa /api/v2/orders.
        Log::info('Peticion orders', ['version' => $request->header('X-Api-Version', '1')]);
        return $next($request);
    }

    private function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        [$header64, $payload64, $signature64] = $parts;
        $header = json_decode($this->base64UrlDecode($header64), true);
        if (!is_array($header) || ($header['alg'] ?? null) !== 'HS256') return null;

        // La firma se calcula con el mismo secreto que usa Node.
        $expected = hash_hmac('sha256', "$header64.$payload64", config('delivery.jwt_secret'), true);
        if (!hash_equals($expected, $this->base64UrlDecode($signature64))) return null;
        $payload = json_decode($this->base64UrlDecode($payload64), true);
        if (!is_array($payload) || !is_string($payload['id'] ?? null) || empty($payload['id'])) return null;
        if (!in_array($payload['role'] ?? null, ['cliente', 'repartidor', 'admin'], true)) return null;
        if (!is_numeric($payload['exp'] ?? null) || $payload['exp'] <= time()) return null;
        if (isset($payload['nbf']) && $payload['nbf'] > time()) return null;
        return $payload;
    }

    private function base64UrlDecode(string $value): string
    {
        return base64_decode(strtr($value, '-_', '+/'), true) ?: '';
    }
}
