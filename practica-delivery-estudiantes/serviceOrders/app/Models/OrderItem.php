<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = ['order_id', 'dish_id', 'dish_name', 'unit_price', 'quantity', 'subtotal'];
    protected $casts = ['dish_id' => 'integer', 'quantity' => 'integer',
        'unit_price' => 'decimal:2', 'subtotal' => 'decimal:2'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
