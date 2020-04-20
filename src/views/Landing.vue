<template>
  <v-row align="center" justify="center">
    <v-col cols="8">
      <v-card>
        <v-card-title>
          <p class="text-center" style="width:100%">FreeFlowConnect</p>
        </v-card-title>
        <v-card-text>
          <v-row align="center">
            <v-col align="center">
              <v-form @submit.prevent="joinRoom" v-model="valid">
                <v-text-field
                  filled
                  label="Invite url or room ID"
                  persistent-hint
                  v-model="inviteUrl"
                  hint="Paste the url or room ID you've received"
                  :rules="inviteUrlRules"
                  required
                >
                  <template v-slot:append>
                    <v-btn :disabled="!valid" small text type="submit">Join room</v-btn>
                  </template>
                </v-text-field>
              </v-form>
            </v-col>
            <v-divider vertical></v-divider>
            <v-col align="center">
              <v-btn text @click="create">Create room</v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script>
  import {mapActions} from 'vuex'
export default {
  data() {
    return {
      valid: false,
      inviteUrlRules: [
        url => !!url || 'Invite url is required'
      ],
      inviteUrl: null
    };
  },
  methods: {
    ...mapActions(['createTeam']),
    create() {
      this.createTeam()
      this.$router.push({name: 'room'})
    },
    joinRoom() {
      let token = ''
      const reg = new RegExp(`${window.location.href}room/invite/(.*)`)
      if (new RegExp(`${window.location.href}room/invite/(.*)`).test(this.inviteUrl)) {
        token = this.inviteUrl.match(reg)[1]
      } else {
        token = this.inviteUrl
      }
      this.$router.push({
        name: "waitingRoom",
        params: {
          token
        }
      });
    }
  }
};
</script>