<script setup lang="ts">
import { RouterView } from 'vue-router'
import logo from '@/assets/full-aynux.png'
</script>

<template>
  <div class="min-h-screen bg-aynux-gradient flex flex-col relative overflow-hidden">
    <!-- Decorative orbs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-1/4 w-64 h-64 bg-primary-400/5 rounded-full blur-2xl"></div>
    </div>

    <!-- Glass header -->
    <header class="h-16 bg-white/10 backdrop-blur-md border-b border-white/10 flex items-center px-6 shrink-0 relative z-20">
      <img :src="logo" alt="Aynux" class="h-10" />
    </header>

    <!-- Content -->
    <main class="flex-1 overflow-y-auto relative z-10">
      <div class="max-w-7xl mx-auto p-6">
        <RouterView />
      </div>
    </main>

    <!-- Footer -->
    <footer class="shrink-0 py-3 text-center text-white/30 text-xs relative z-10">
      Powered by Excelencia Software
    </footer>
  </div>
</template>
