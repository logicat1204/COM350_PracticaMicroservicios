<?php

use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

// Laravel ya agrega /api, aqui solo agregamos v1.
Route::prefix('v1')->middleware('jwt')->group(function () {
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show'])->whereNumber('id');
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus'])->whereNumber('id');
    Route::delete('/orders/{id}', [OrderController::class, 'destroy'])->whereNumber('id');
});
