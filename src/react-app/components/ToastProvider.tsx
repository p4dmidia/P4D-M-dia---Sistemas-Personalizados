"use client";

import { default as React } from 'react'; // Removido importação explícita de React
import { Toaster } from 'react-hot-toast';

const ToastProvider = () => {
  return <Toaster />;
};

export default ToastProvider;