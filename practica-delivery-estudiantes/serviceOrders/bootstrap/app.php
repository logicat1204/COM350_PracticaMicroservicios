<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

// Esqueleto minimo de Laravel 12. Complete segun la PARTE B de la guia:
// - registrar routes/api.php en withRouting(api: ...)
// - alias del middleware 'jwt'
// - responder siempre en JSON (shouldRenderJsonWhen)
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
