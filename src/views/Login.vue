<template>
  <v-row align="center" justify="center">
      <v-card loading width="500">
        <v-card-title>
          Login
        </v-card-title>
        <v-card-text v-if="$route.query.callback">
          Validating auth...
        </v-card-text>
        <v-card-text v-else>
          Redirecting to login...
        </v-card-text>
      </v-card>
  </v-row>
</template>
<script>
import { mapActions, mapGetters } from 'vuex'
export default {
  mounted () {
    if(this.$route.query.callback) {
      this.checkResponse(window.location.href)
    } else {
      this.generateLoginUrl(this.$route.query)
    }
  },
  methods: {
    ...mapActions([
      'generateLoginUrl',
      'checkResponse'
    ])
  },
  computed: {
    ...mapGetters([
      'loginUrl',
      'account'
    ])
  },
  watch: {
    loginUrl(val) {
      if(val){
        window.location.replace(val)
      }
    },
    account(val) {
      if(val) {
        if(this.$route.query.redirect) {
          this.$router.push(this.$route.query.redirect)
        } else {
          this.$router.push({name: 'room'})
        }
      }
    }
  }
}
</script>