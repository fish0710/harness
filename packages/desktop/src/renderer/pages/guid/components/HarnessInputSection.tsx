import React, { type ReactNode } from 'react';
import styles from './HarnessInputSection.module.css';

interface HarnessInputSectionProps {
  children: ReactNode;
  isActive: boolean;
}

const HarnessInputSection: React.FC<HarnessInputSectionProps> = ({ children, isActive }) => {
  return (
    <div className={styles.inputSection}>
      <div className={`${styles.inputWrapper} ${isActive ? styles.inputFocused : ''}`}>
        <div className={styles.inner}>{children}</div>
      </div>
    </div>
  );
};

export default HarnessInputSection;
