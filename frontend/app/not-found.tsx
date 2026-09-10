"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Next.js применяет корневой app/not-found и к notFound(), и к любому
// несовпавшему URL (начиная с 13.3) — так что один файл закрывает оба случая.
//
// Редиректим через router.replace() в эффекте, а не через redirect() в
// рендере серверного компонента: redirect() бросает исключение прямо во
// время рендера, а React 19 в dev-режиме пытается замерить тайминг этого
// рендера через performance.measure() — из-за прерванного throw'ом рендера
// метки рассинхронизируются, и в консоли падает "cannot have a negative
// timestamp". На сам редирект это не влияло (HTTP 307 всё равно уходил),
// но шум в консоли раздражал — так его не будет вовсе.
export default function NotFoundRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
