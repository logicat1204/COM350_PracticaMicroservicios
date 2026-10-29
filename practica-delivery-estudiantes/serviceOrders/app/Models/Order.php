<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = ['user_id', 'user_name', 'restaurant_id', 'restaurant_name',
        'delivery_address', 'notes', 'status', 'total'];
    protected $casts = ['restaurant_id' => 'integer', 'total' => 'decimal:2'];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
