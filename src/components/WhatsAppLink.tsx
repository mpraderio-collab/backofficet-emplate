"use client";

export function WhatsAppLink({ phone, message }: { phone: string; message?: string }) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  const href = message
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digits}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="Escribir por WhatsApp"
      className="inline-flex items-center text-ok-ink hover:text-ok-ink/80"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38a9.94 9.94 0 0 0 4.79 1.22h.01c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.29c0-4.53 3.69-8.22 8.26-8.22 2.2 0 4.27.86 5.83 2.42a8.17 8.17 0 0 1 2.42 5.81c0 4.53-3.7 8.14-8.26 8.14Zm4.52-6.14c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42-.14 0-.31-.01-.47-.01-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.04 0 1.2.88 2.37 1 2.53.12.16 1.73 2.64 4.19 3.7.58.25 1.04.4 1.4.51.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28Z" />
      </svg>
    </a>
  );
}
