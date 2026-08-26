// 全局表单状态（复刻小程序 app.globalData.formData）
// 模块级单例：客户端路由间共享；整页刷新后回落到默认值（与小程序冷启动一致）
import { defaultFormData } from './defaultData.js';

let formData = defaultFormData();

export function getFormData() {
  return formData;
}

export function saveFormData(f) {
  formData = f;
}

export function resetFormData() {
  formData = defaultFormData();
}
