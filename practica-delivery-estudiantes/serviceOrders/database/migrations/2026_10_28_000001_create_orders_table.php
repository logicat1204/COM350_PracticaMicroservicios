<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            // Estos identificadores vienen de otras bases, por eso no tienen FK.
            $table->string('user_id', 40);
            $table->string('user_name', 100);
            $table->unsignedInteger('restaurant_id');
            $table->string('restaurant_name', 100);
            $table->string('delivery_address', 200);
            $table->string('notes', 255)->nullable();
            $table->string('status', 20)->default('pendiente');
            $table->decimal('total', 10, 2)->default(0);
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
