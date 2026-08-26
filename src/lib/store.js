// 全局表单状态（复刻小程序 app.globalData.formData）
// 模块级单例：客户端路由间共享；整页刷新后回落到默认值（与小程序冷启动一致）
// 草稿持久化：每次保存表单同时写入 localStorage，首页据此询问是否保留上次数据
import { defaultFormData } from './defaultData.js';

let formData = defaultFormData();
const DRAFT_KEY = 'family_insurance_draft';
const FLOW_KEY = 'family_insurance_flow';

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

// 填写流程标记：首页挂载时写入，非首页页面上若无此标记（深层链接/浏览器恢复旧标签页）
// 则重定向回首页，保证每次进入先落首页、再决定是否询问保留上次数据。
export function markInFlow() {
  try {
    sessionStorage.setItem(FLOW_KEY, '1');
  } catch (e) {}
}

export function isInFlow() {
  try {
    return sessionStorage.getItem(FLOW_KEY) === '1';
  } catch (e) {
    return false;
  }
}
