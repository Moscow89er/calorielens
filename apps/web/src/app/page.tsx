import Link from 'next/link';
import styles from '@/app/page.module.css';

export default function HomePage() {
  return (
    <main className={styles.wrapper}>
      <h1 className={styles.title}>CalorieLens Web</h1>
      <p className={styles.subtitle}>Выберите сценарий:</p>

      <nav className={styles.links} aria-label="Main navigation">
        <Link className={styles.link} href="/register">
          Регистрация
        </Link>
        <Link className={styles.link} href="/login">
          Логин
        </Link>
        <Link className={styles.link} href="/dashboard">
          Dashboard
        </Link>
      </nav>

      <p className={styles.note}>
        Для работы форм запустите backend API и проверьте `NEXT_PUBLIC_API_URL`.
      </p>
    </main>
  );
}
