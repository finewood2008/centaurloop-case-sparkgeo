import { useEffect, useState } from 'react';
import { I18nProvider } from './i18n';
import { SparkShell } from './ui/SparkShell';
import { OnboardingWizard } from './ui/OnboardingWizard';
import { useBrandStore } from './spark/brandStore';
import { syncBrandProfileToMemory } from './spark/brandMemory';

function AppInner() {
  const isSetupCompleted = useBrandStore((s) => s.brand?.setupCompleted === true);
  const brand = useBrandStore((s) => s.brand);
  const [wizardDone, setWizardDone] = useState(false);

  useEffect(() => {
    if (brand?.setupCompleted) {
      void syncBrandProfileToMemory(brand);
    }
  }, [brand]);

  return (
    <>
      <SparkShell />
      {!isSetupCompleted && !wizardDone && (
        <OnboardingWizard onComplete={() => setWizardDone(true)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  );
}
