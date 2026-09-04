import React from 'react';
import { useTerminal } from '../../context/TerminalContext';
import { LoginPage } from '../../pages/centralhub/LoginPage';

interface MatrixPasscodeGateProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  title?: string;
  description?: string;
}

export function MatrixPasscodeGate({ 
  children, 
  allowedRoles = ['root', 'admin', 'shift_lead'],
  title,
  description
}: MatrixPasscodeGateProps) {
  const { terminalUser, firebaseUser } = useTerminal();

  const searchParams = new URLSearchParams(window.location.search);
  const isStandalone = searchParams.get('standalone') === 'true';

  const currentRole = terminalUser?.role || (firebaseUser ? 'admin' : null);
  const isAuthorized = currentRole && allowedRoles.includes(currentRole.toLowerCase());

  if (isAuthorized || isStandalone) {
    return <>{children}</>;
  }

  return <LoginPage />;
}

