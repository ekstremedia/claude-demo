<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Inertia keeps this <title> in sync via the `title` callback in app.ts. --}}
    <title inertia>{{ config('app.name', 'Claude Demo') }}</title>

    {{-- Vite injects the hashed asset tags (and the HMR client in dev). The
         entry is app.ts; @vite also pulls in the compiled Tailwind CSS. --}}
    @vite(['resources/css/app.css', 'resources/js/app.ts'])
    @inertiaHead
</head>
<body class="h-full antialiased">
    @inertia
</body>
</html>
