<script setup>


  
</script>

<template>
  <div class="position-absolute" style="top: 0;left: 0;z-index: 2;" >
    <h1>Hello App!</h1>
    <p>
      <strong>Current route path:</strong> {{ $route.fullPath }}
    </p>
  </div>
  
  <RouterView class="position-absolute" style="top: 0;left: 0;z-index: 0;" />
  
</template>

<style scoped>
h1, p {
  color: rgb(213, 64, 64);
  z-index: 2;
}

</style>