<?php

return [
    'jwt_secret' => env('JWT_SECRET', 'deliverySucre2026superSecreto'),
    'restaurants_url' => env('RESTAURANTS_URL', 'http://localhost:3002/api/v1'),
    'statuses' => ['pendiente', 'confirmado', 'en_preparacion', 'en_camino', 'entregado', 'cancelado'],
];
