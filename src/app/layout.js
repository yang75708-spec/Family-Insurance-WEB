import "./globals.css";

export const metadata = {
  title: "家庭保险决策助手",
  description: "4 步填写家庭信息，生成健康 / 寿险 / 养老三大保障建议",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
