<template>
  <v-card class="no-users">
    <v-card-title>
      <v-row>
        <v-col class="py-0">
          <h3>No users yet</h3>
        </v-col>
        <v-col align="end" class="py-0">
          <v-btn icon @click="$emit('closeInvitations')">
            <v-icon color="black">close</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>
    <v-card-text>
      <v-text-field
          filled
          label="Invite link"
          persistent-hint
          readonly
          hint="Invite people by sharing this link"
          :value="inviteLink"
      >
        <template v-slot:append>
          <v-btn small icon text @click="copyUrl">
            <v-icon>file_copy</v-icon>
          </v-btn>
        </template>
      </v-text-field>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapActions } from 'vuex';
export default {
  name: "InviteUsers",
  methods: {
    ...mapActions(['setSnackbarMessage']),
    async copyUrl() {
      try {
        await navigator.clipboard.writeText(this.inviteLink);
        this.setSnackbarMessage({
          text: `Link copied to clipboard`,
        });
      } catch (e) {
        this.setSnackbarMessage({
          type: 'warning',
          text: `Failed to copy link to clipboard`,
        });
        console.error(e);
      }
    },
  },
  computed: {
    inviteLink() {
      let baseUrl = window.location.href;
      if (baseUrl.charAt(baseUrl.length - 1) !== '/') {
        baseUrl += '/';
      }
      return `${baseUrl}`;
    },
  }
}
</script>

<style scoped>
.no-users {
  position: fixed;
  width: 35rem;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>