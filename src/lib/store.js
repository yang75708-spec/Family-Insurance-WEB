// 全局表单状态（复刻小程序 app.globalData.formData）
// 模块级单例：客户端路由间共享；整页刷新后回落到默认值（与小程序冷启动一致）
// 草稿持久化：每次保存表单同时写入 localStorage，首页据此询问是否保留上次数据
import { defaultFormData } from './defaultData.js';

let formData = defaultFormData();
const DRAFT_KEY = 'family_insurance_draft';

function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeDraft(f) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(f));
  } catch (e) {}
}

function removeDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {}
}

export function getFormData() {
  return formData;
}

export function saveFormData(f) {
  formData = f;
  writeDraft(f);
}

export function loadDraft() {
  return readDraft();
}

export function clearDraft() {
  formData = defaultFormData();
  removeDraft();
}

export function resetFormData() {
  formData = defaultFormData();
  removeDraft();
}
