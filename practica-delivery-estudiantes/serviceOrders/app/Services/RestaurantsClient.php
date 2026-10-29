<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class RestaurantsClient
{
    public function restaurant(int $id, string $bearer): ?array
    {
        return $this->get("restaurants/$id", $bearer);
    }

    public function dish(int $id, string $bearer): ?array
    {
        return $this->get("dishes/$id", $bearer);
    }

    private function get(string $path, string $bearer): ?array
    {
        $url = rtrim(config('delivery.restaurants_url'), '/');
        $response = Http::withHeaders(['Authorization' => $bearer])
            ->acceptJson()->timeout(5)->get("$url/$path");
        if ($response->status() === 404) return null;
        $response->throw();
        return $response->json();
    }
}
