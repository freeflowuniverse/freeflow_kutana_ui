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
              <v-form @submit.prevent="joinRoom">
                <v-text-field
                  filled
                  label="Invite url"
                  persistent-hint
                  v-model="inviteUrl"
                  hint="Paste the url you received"
                >
                  <template v-slot:append>
                    <v-btn small text type="submit">Join room</v-btn>
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
      inviteUrl: null
    };
  },
  methods: {
    ...mapActions(['createTeam']),
    create() {
      this.createTeam(),
      this.$router.push({name: 'room'})
    },
    joinRoom() {
      let baseUrl = window.location.href;
      if (baseUrl.charAt(baseUrl.length - 1) != "/") {
        baseUrl += "/";
      }
      let reg = new RegExp(`${baseUrl}room/invite/(.*)`);
      if (this.inviteUrl.match(reg) && this.inviteUrl.match(reg)[1]) {
        this.$router.push({
          name: "waitingRoom",
          params: {
            token: this.inviteUrl.match(reg)[1]
          }
        });
      }
    }
  }
};
</script>