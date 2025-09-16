<template>
  <div class="wrap">
    <h1>APK 上传 & 一键直链下载</h1>

    <form class="card" @submit.prevent="upload">
      <input type="file" accept=".apk" @change="onPick" />
      <button :disabled="!file || loading" type="submit">
        {{ loading ? "上传中…" : "上传" }}
      </button>
    </form>

    <div v-if="result.fileUrl" class="card">
      <h2>上传完成</h2>
      <p>
        直链：
        <a :href="result.fileUrl" target="_blank" @click.prevent="openDirect">
          {{ result.fileUrl }}
        </a>
      </p>

      <div class="qr">
        <img :src="result.qrCodeDataUrl" alt="下载二维码" />
      </div>

      <div class="btns">
        <button @click="copyLink">复制直链</button>
        <button @click="openDirect">立即测试下载</button>
      </div>

      <p class="tip">提示：手机扫码或点击上面的直链，浏览器应直接弹出下载。</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
// import { SERVER_ORIGIN } from "./api";
import { API_BASE } from "./api";
const file = ref(null);
const loading = ref(false);
const result = ref({ fileUrl: "", qrCodeDataUrl: "" });

function onPick(e) {
  file.value = e.target.files?.[0] ?? null;
}

async function upload() {
  if (!file.value) return alert("请选择 .apk 文件");
  const form = new FormData();
  form.append("file", file.value);

  loading.value = true;
  try {
    const resp = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: form,
    });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.message || "上传失败");

    result.value = {
      fileUrl: data.fileUrl,
      qrCodeDataUrl: data.qrCodeDataUrl,
    };
  } catch (e) {
    alert(e.message || "上传失败");
  } finally {
    loading.value = false;
  }
}

function copyLink() {
  if (!result.value.fileUrl) return;
  navigator.clipboard.writeText(result.value.fileUrl).then(
    () => alert("已复制直链到剪贴板"),
    () => alert("复制失败，请手动复制")
  );
}

// 直接打开直链，应该触发浏览器下载
function openDirect() {
  if (!result.value.fileUrl) return;
  window.open(result.value.fileUrl, "_blank");
}
</script>

<style>
* {
  box-sizing: border-box;
}
body {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}
.wrap {
  max-width: 720px;
  margin: 40px auto;
  padding: 0 16px;
}
h1 {
  font-size: 22px;
  margin-bottom: 16px;
}
.card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
}
button {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  background: #fff;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.qr {
  margin-top: 12px;
}
.qr img {
  width: 220px;
  height: 220px;
  object-fit: contain;
}
.btns {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.tip {
  color: #6b7280;
  font-size: 12px;
  margin-top: 8px;
}
</style>
