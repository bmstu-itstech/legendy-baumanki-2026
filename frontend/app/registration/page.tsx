import { redirect } from "next/navigation";

// Регистрация временно закрыта — страница отключена, гостей уводим на вход.
export default function RegistrationPage() {
  redirect("/login");
}
