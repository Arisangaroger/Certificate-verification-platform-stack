interface StatusBannerProps {
  type: 'verified' | 'issued' | 'error';
  message: string;
}

export function StatusBanner({ type, message }: StatusBannerProps) {
  const classNames = {
    verified: 'status-banner status-banner-verified',
    issued: 'status-banner status-banner-issued',
    error: 'status-banner status-banner-error',
  };

  const icons = {
    verified: '✓',
    issued: '⏳',
    error: '✗',
  };

  return (
    <div className={classNames[type]} role="alert">
      <span>{icons[type]}</span> {message}
    </div>
  );
}
