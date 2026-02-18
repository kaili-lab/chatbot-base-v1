// (app) 路由组的共享布局，Task 04 会实现完整的侧边栏 + 顶部栏
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
