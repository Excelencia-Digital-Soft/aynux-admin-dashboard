<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-aynux-gradient flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Decorative elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-1/4 w-64 h-64 bg-primary-400/5 rounded-full blur-2xl"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <RouterView />
    </div>
  </div>
</template>
