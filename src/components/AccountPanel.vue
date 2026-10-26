<script setup lang="ts">
import type { AuthError } from '~/cloud'
import { account, cropAvatar, signIn, signOut, signUp, uploadAvatar } from '~/cloud'
import { t } from '~/i18n'

/** on the sign-in page in front of the game, rather than under the leaderboard */
defineProps<{ gate?: boolean }>()

// most people reaching the form are new, so it opens on 注册
const signingUp = ref(true)
const email = ref('')
const password = ref('')
const nickname = ref('')
const avatar = ref<Blob | null>(null)
const preview = ref('')
const busy = ref(false)
const error = ref<AuthError | 'avatar' | ''>('')
const confirmSent = ref(false)

/** what still blocks the button, said out loud instead of a silently disabled button */
const missing = computed(() => {
  const m: string[] = []
  if (signingUp.value && !avatar.value)
    m.push(t('missing-avatar'))
  if (signingUp.value && !nickname.value.trim())
    m.push(t('missing-nickname'))
  if (!/^\S+@\S+\.\S+$/.test(email.value.trim()))
    m.push(t('missing-email'))
  if (password.value.length < 6)
    m.push(t('missing-password'))
  return m
})
const canSubmit = computed(() => !busy.value && !missing.value.length)

/** crop the picked photo; returns null (and shows an error) if the browser can't read it */
async function readPicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file)
    return null
  try {
    return await cropAvatar(file)
  }
  catch {
    error.value = 'avatar'
    return null
  }
}

async function pickForSignUp(e: Event) {
  const blob = await readPicked(e)
  if (!blob)
    return
  if (preview.value)
    URL.revokeObjectURL(preview.value)
  avatar.value = blob
  preview.value = URL.createObjectURL(blob)
  if (error.value === 'avatar')
    error.value = ''
}

async function changeAvatar(e: Event) {
  const blob = await readPicked(e)
  if (!blob)
    return
  busy.value = true
  try {
    await uploadAvatar(blob)
    error.value = ''
  }
  catch {
    error.value = 'avatar'
  }
  busy.value = false
}

async function submit() {
  if (!canSubmit.value)
    return
  busy.value = true
  error.value = ''
  try {
    if (signingUp.value) {
      const r = await signUp(email.value.trim(), password.value, nickname.value.trim(), avatar.value!)
      error.value = r.error || ''
      if (r.error === 'exists')
        signingUp.value = false
      if (r.confirm) {
        confirmSent.value = true
        signingUp.value = false
      }
    }
    else {
      error.value = (await signIn(email.value.trim(), password.value)).error || ''
    }
  }
  catch {
    error.value = 'unknown'
  }
  busy.value = false
}

function switchTo(up: boolean) {
  signingUp.value = up
  if (error.value !== 'exists')
    error.value = ''
}

onBeforeUnmount(() => preview.value && URL.revokeObjectURL(preview.value))
</script>

<template>
  <div v-if="account" flex="~ col" items-center gap-3 text-sm>
    <label cursor-pointer relative group :title="t('avatar-change')">
      <Avatar v-if="account.avatarV != null" :user-id="account.id" :v="account.avatarV" :name="account.nickname" w-16 h-16 text-2xl />
      <div v-else w-20 h-20 rounded-full border="2 dashed primary" flex items-center justify-center text-primary>
        <div i-carbon-camera text-2xl />
      </div>
      <div
        v-if="account.avatarV != null"
        absolute inset-0 rounded-full bg-black:45 text-white text-xs flex items-center justify-center
        op0 group-hover:op100 transition-opacity
      >
        {{ t('avatar-change') }}
      </div>
      <input type="file" accept="image/*" hidden :disabled="busy" @change="changeAvatar">
    </label>
    <span v-if="account.avatarV == null" text-primary>{{ t(busy ? 'avatar-uploading' : 'avatar-pick') }}</span>
    <div flex items-center gap-3>
      <span op60>{{ t('account-signed-in', account.nickname || account.email) }}</span>
      <button ghost-btn text-xs py0.5 px3 @click="signOut()">
        {{ t('account-sign-out') }}
      </button>
    </div>
    <div v-if="error" text-mis>
      {{ t(`account-err-${error}` as any) }}
    </div>
  </div>

  <form v-else w-full max-w-72 mx-auto flex="~ col gap-2" select-text @submit.prevent="submit">
    <p v-if="!gate" text-sm op70 mb1>
      {{ t('account-cta') }}
    </p>
    <div flex border="~ base rounded" overflow-hidden text-sm mb2>
      <button
        v-for="up of [true, false]" :key="String(up)" type="button"
        flex-1 py2 transition-colors
        :class="signingUp === up ? 'bg-primary text-white' : 'op60 hover:op100'"
        @click="switchTo(up)"
      >
        {{ t(up ? 'account-sign-up' : 'account-sign-in') }}
      </button>
    </div>

    <label v-if="signingUp" mx-auto mb1 cursor-pointer flex="~ col" items-center gap-1>
      <img v-if="preview" :src="preview" alt="" w-20 h-20 rounded-full object-cover>
      <div v-else w-20 h-20 rounded-full border="2 dashed primary" flex items-center justify-center text-primary>
        <div i-carbon-camera text-2xl />
      </div>
      <span text-xs :class="preview ? 'op50' : 'text-primary'">{{ t(preview ? 'avatar-change' : 'avatar-pick') }}</span>
      <input type="file" accept="image/*" hidden @change="pickForSignUp">
    </label>
    <input
      v-if="signingUp" v-model="nickname"
      border="2 base" bg-transparent p2 outline-none text-center text-sm
      maxlength="16" autocomplete="nickname" :placeholder="t('account-nickname')"
    >
    <input
      v-model="email"
      border="2 base" bg-transparent p2 outline-none text-center text-sm
      type="email" autocomplete="email" :placeholder="t('account-email')"
    >
    <input
      v-model="password"
      border="2 base" bg-transparent p2 outline-none text-center text-sm
      type="password" :autocomplete="signingUp ? 'new-password' : 'current-password'"
      :placeholder="t('account-password')"
    >
    <div v-if="error" text-sm text-mis>
      {{ t(`account-err-${error}` as any) }}
    </div>
    <div v-else-if="confirmSent" text-sm text-ok>
      {{ t('account-confirm') }}
    </div>
    <button btn py2 mt1 type="submit" :disabled="!canSubmit">
      {{ busy ? '…' : t(signingUp ? 'account-sign-up' : 'account-sign-in') }}
    </button>
    <div v-if="missing.length" text-xs op50>
      {{ t('missing', missing.join('、')) }}
    </div>
    <p v-if="!gate" text-xs op40>
      {{ t('account-sync-note') }}
    </p>
  </form>
</template>
