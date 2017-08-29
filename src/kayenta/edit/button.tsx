import * as React from 'react';
import { ReactNode } from 'react';

interface IButtonProps {
  className?: string;
  disabled?: boolean;
  onClick: (event: any) => void;
  children: ReactNode;
}

function Button({ className = '', disabled = false, onClick, children }: IButtonProps) {
  return (
    <button className={'passive ' + className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export default Button;
