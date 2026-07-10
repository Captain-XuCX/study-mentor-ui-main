import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "登录 · 智学助手" },
      { name: "description", content: "使用手机号验证码登录智学助手,开启个性化学习之旅。" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/" });
  }, [navigate]);

  return null;
}