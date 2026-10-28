<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'service' => 'orders',
    'framework' => 'Laravel '.app()->version(),
    'database' => 'PostgreSQL',
]));
