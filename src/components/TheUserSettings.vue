<template>
  <div>
    <v-toolbar dense dark color="primary">
      <v-btn icon @click="$root.$emit('toggleSettings')">
          <v-icon color="white">arrow_back</v-icon>
      </v-btn>
      <v-spacer />
      <v-toolbar-title>Settings</v-toolbar-title>
      <v-spacer />
    </v-toolbar>
  </div>
</template>

<script>
export default {

}
</script>

<style>

</style>