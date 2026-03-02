"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TutorialStep = {
  path: string;
  selector: string;
  title: string;
  body: string;
};
const TUTORIAL_COMMUNITY_CREATED_EVENT = "sns-tutorial-community-created";

function extractWalletAddress(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (!value || typeof value !== "object") {
    return "";
  }
  const candidate = value as {
    address?: unknown;
    selectedAddress?: unknown;
  };
  if (typeof candidate.address === "string") {
    return candidate.address.trim();
  }
  if (typeof candidate.selectedAddress === "string") {
    return candidate.selectedAddress.trim();
  }
  return "";
}

const DAPP_TUTORIAL_STEPS: TutorialStep[] = [
  {
    path: "/communities",
    selector: '[data-tour="wallet-connect-area"]',
    title: "Step 1: Connect Wallet",
    body: "Use this wallet area to connect MetaMask and complete sign-in.",
  },
  {
    path: "/communities",
    selector: ".communities-page .community-create-card",
    title: "Step 2: Open Community Creation",
    body: "Click Create New Community to open the registration form.",
  },
  {
    path: "/communities",
    selector: '[data-tour="dapp-registration-fields"]',
    title: "Step 3: Fill Required Fields",
    body: "Fill Service Name and at least one Contract Address in this form.",
  },
  {
    path: "/communities",
    selector: '[data-tour="dapp-register-community"]',
    title: "Step 4: Create Community",
    body: "Click Register Community and wait for successful creation.",
  },
  {
    path: "/communities",
    selector: '[data-tour="dapp-created-community"]',
    title: "Step 5: Review New Community",
    body: "Your new community card is highlighted. Click Finish to end the tutorial.",
  },
];

function normalizePath(value: string) {
  if (!value) {
    return "/";
  }
  if (value === "/") {
    return value;
  }
  return value.replace(/\/+$/, "");
}

function parseStep(raw: string | null) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  const intParsed = Math.trunc(parsed);
  if (intParsed < 0) {
    return 0;
  }
  if (intParsed >= DAPP_TUTORIAL_STEPS.length) {
    return DAPP_TUTORIAL_STEPS.length - 1;
  }
  return intParsed;
}

function buildUrl(path: string, params: URLSearchParams) {
  const query = params.toString();
  if (!query) {
    return path;
  }
  return `${path}?${query}`;
}

export function QuickStartTutorial() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tutorialMode = searchParams.get("tutorial");
  const isDappTutorial = tutorialMode === "dapp";
  const stepIndex = parseStep(searchParams.get("step"));
  const currentStep = DAPP_TUTORIAL_STEPS[stepIndex];
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [searchingTarget, setSearchingTarget] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletCheckCompleted, setWalletCheckCompleted] = useState(false);
  const [isCreateCommunityModalOpen, setIsCreateCommunityModalOpen] = useState(false);
  const [createModalCheckCompleted, setCreateModalCheckCompleted] = useState(false);
  const [isRegistrationFormReady, setIsRegistrationFormReady] = useState(false);
  const [registrationFormCheckCompleted, setRegistrationFormCheckCompleted] =
    useState(false);
  const [isCommunityCreated, setIsCommunityCreated] = useState(false);
  const [communityCreatedCheckCompleted, setCommunityCreatedCheckCompleted] =
    useState(false);
  const autoAdvanceStepRef = useRef<number | null>(null);
  const previousNextDisabledRef = useRef<boolean | null>(null);
  const autoAdvancedOnCurrentStepRef = useRef(false);

  const isOnStepPath = useMemo(
    () => normalizePath(pathname) === normalizePath(currentStep.path),
    [pathname, currentStep.path]
  );

  const goToStep = useCallback((nextStepIndex: number, expectedCurrentStep?: number) => {
    if (
      typeof expectedCurrentStep === "number" &&
      typeof window !== "undefined"
    ) {
      const runtimeParams = new URLSearchParams(window.location.search);
      const runtimeStep = parseStep(runtimeParams.get("step"));
      if (runtimeStep !== expectedCurrentStep) {
        return;
      }
    }
    const clamped = Math.min(
      Math.max(nextStepIndex, 0),
      DAPP_TUTORIAL_STEPS.length - 1
    );
    const destination = DAPP_TUTORIAL_STEPS[clamped];
    const next = new URLSearchParams(searchParams.toString());
    next.set("tutorial", "dapp");
    next.set("step", String(clamped));
    const href = buildUrl(destination.path, next);
    if (normalizePath(pathname) === normalizePath(destination.path)) {
      router.replace(href, { scroll: false });
      return;
    }
    router.push(href);
  }, [pathname, router, searchParams]);

  const closeTutorial = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("tutorial");
    next.delete("step");
    router.replace(buildUrl(pathname, next), { scroll: false });
  };

  useEffect(() => {
    if (!isDappTutorial) {
      setTargetElement(null);
      setTargetRect(null);
      setSearchingTarget(false);
      return;
    }
    if (!isOnStepPath) {
      setTargetElement(null);
      setTargetRect(null);
      setSearchingTarget(false);
      return;
    }

    let canceled = false;
    let timer: number | null = null;

    const locate = (attempt = 0) => {
      if (canceled) {
        return;
      }
      const found = document.querySelector(currentStep.selector);
      if (found instanceof HTMLElement) {
        setTargetElement(found);
        setSearchingTarget(false);
        found.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
        return;
      }
      if (attempt >= 30) {
        setTargetElement(null);
        setSearchingTarget(false);
        return;
      }
      timer = window.setTimeout(() => locate(attempt + 1), 120);
    };

    setSearchingTarget(true);
    setTargetElement(null);
    setTargetRect(null);
    locate();

    return () => {
      canceled = true;
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [currentStep.selector, isDappTutorial, isOnStepPath]);

  useEffect(() => {
    if (!targetElement) {
      setTargetRect(null);
      return;
    }

    targetElement.classList.add("quickstart-tour-target");

    const refresh = () => {
      setTargetRect(targetElement.getBoundingClientRect());
    };

    refresh();
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => refresh());
      resizeObserver.observe(targetElement);
    }

    return () => {
      targetElement.classList.remove("quickstart-tour-target");
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
      resizeObserver?.disconnect();
    };
  }, [targetElement]);

  useEffect(() => {
    if (!isDappTutorial) {
      setIsWalletConnected(false);
      setWalletCheckCompleted(false);
      return;
    }

    let canceled = false;
    const ethereum = (window as any).ethereum;

    const updateWalletConnection = async () => {
      if (!ethereum?.request) {
        if (!canceled) {
          setIsWalletConnected(false);
          setWalletCheckCompleted(true);
        }
        return;
      }

      try {
        const accounts = (await ethereum.request({
          method: "eth_accounts",
        })) as unknown;
        const connected = Array.isArray(accounts)
          ? accounts.some((account) => Boolean(extractWalletAddress(account)))
          : Boolean(extractWalletAddress(accounts));
        if (!canceled) {
          setIsWalletConnected(connected);
          setWalletCheckCompleted(true);
        }
      } catch {
        if (!canceled) {
          setIsWalletConnected(false);
          setWalletCheckCompleted(true);
        }
      }
    };

    const handleAccountsChanged = (accounts: unknown[]) => {
      const connected = Array.isArray(accounts)
        ? accounts.some((account) => Boolean(extractWalletAddress(account)))
        : false;
      setIsWalletConnected(connected);
      setWalletCheckCompleted(true);
    };

    const handleFocus = () => {
      void updateWalletConnection();
    };

    void updateWalletConnection();
    window.addEventListener("focus", handleFocus);
    ethereum?.on?.("accountsChanged", handleAccountsChanged);
    ethereum?.on?.("connect", handleFocus);
    ethereum?.on?.("disconnect", handleFocus);

    return () => {
      canceled = true;
      window.removeEventListener("focus", handleFocus);
      ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum?.removeListener?.("connect", handleFocus);
      ethereum?.removeListener?.("disconnect", handleFocus);
    };
  }, [isDappTutorial]);

  useEffect(() => {
    if (!isDappTutorial) {
      setIsCreateCommunityModalOpen(false);
      setCreateModalCheckCompleted(false);
      return;
    }

    const detectCreateModal = () => {
      const modal = document.querySelector(
        ".community-create-modal.is-open:not(.community-action-modal)"
      );
      setIsCreateCommunityModalOpen(Boolean(modal));
      setCreateModalCheckCompleted(true);
    };

    detectCreateModal();

    const observer = new MutationObserver(() => {
      detectCreateModal();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, [isDappTutorial]);

  useEffect(() => {
    if (!isDappTutorial) {
      setIsRegistrationFormReady(false);
      setRegistrationFormCheckCompleted(false);
      return;
    }

    const detectRegistrationReadiness = () => {
      const form = document.querySelector(
        '[data-tour="dapp-registration-form"]'
      );
      if (!(form instanceof HTMLElement)) {
        setIsRegistrationFormReady(false);
        setRegistrationFormCheckCompleted(true);
        return;
      }
      const serviceNameInput = form.querySelector(
        '[data-tour="dapp-service-name"] input'
      );
      const serviceName = serviceNameInput instanceof HTMLInputElement
        ? serviceNameInput.value.trim()
        : "";
      const contractAddressInputs = form.querySelectorAll(
        'input[data-tour="dapp-contract-address-required"]'
      );
      const hasContractAddress = Array.from(contractAddressInputs).some(
        (input) => input instanceof HTMLInputElement && input.value.trim().length > 0
      );
      setIsRegistrationFormReady(Boolean(serviceName) && hasContractAddress);
      setRegistrationFormCheckCompleted(true);
    };

    detectRegistrationReadiness();

    const handleInput = () => {
      detectRegistrationReadiness();
    };
    document.addEventListener("input", handleInput, true);

    const observer = new MutationObserver(() => {
      detectRegistrationReadiness();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      document.removeEventListener("input", handleInput, true);
      observer.disconnect();
    };
  }, [isDappTutorial]);

  useEffect(() => {
    if (!isDappTutorial) {
      setIsCommunityCreated(false);
      setCommunityCreatedCheckCompleted(false);
      return;
    }
    if (stepIndex === 0) {
      setIsCommunityCreated(false);
      setCommunityCreatedCheckCompleted(false);
    }

    const detectCreatedCommunityCard = () => {
      const createdCard = document.querySelector('[data-tour="dapp-created-community"]');
      if (createdCard) {
        setIsCommunityCreated(true);
      }
      setCommunityCreatedCheckCompleted(true);
    };

    const handleCreated = () => {
      setIsCommunityCreated(true);
      setCommunityCreatedCheckCompleted(true);
    };

    detectCreatedCommunityCard();
    window.addEventListener(
      TUTORIAL_COMMUNITY_CREATED_EVENT,
      handleCreated as EventListener
    );

    const observer = new MutationObserver(() => {
      detectCreatedCommunityCard();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener(
        TUTORIAL_COMMUNITY_CREATED_EVENT,
        handleCreated as EventListener
      );
      observer.disconnect();
    };
  }, [isDappTutorial, stepIndex]);

  const isLastStep = stepIndex >= DAPP_TUTORIAL_STEPS.length - 1;
  const requiresWalletConnection = stepIndex === 0;
  const requiresCreateCommunityModalOpen = stepIndex === 1;
  const requiresRegistrationFormCompletion = stepIndex === 2;
  const requiresCommunityCreationSuccess = stepIndex === 3;
  const canAdvance =
    (!requiresWalletConnection || isWalletConnected) &&
    (!requiresCreateCommunityModalOpen || isCreateCommunityModalOpen) &&
    (!requiresRegistrationFormCompletion || isRegistrationFormReady) &&
    (!requiresCommunityCreationSuccess || isCommunityCreated);
  const nextDisabled = !isLastStep && !canAdvance;
  const hasTargetRect = Boolean(targetRect);
  const spotlightStyle =
    targetRect === null
      ? undefined
      : {
          top: `${Math.max(targetRect.top - 6, 0)}px`,
          left: `${Math.max(targetRect.left - 6, 0)}px`,
          width: `${targetRect.width + 12}px`,
          height: `${targetRect.height + 12}px`,
        };

  useEffect(() => {
    if (autoAdvanceStepRef.current !== stepIndex) {
      autoAdvanceStepRef.current = stepIndex;
      previousNextDisabledRef.current = nextDisabled;
      autoAdvancedOnCurrentStepRef.current = false;
      return;
    }

    const previousNextDisabled = previousNextDisabledRef.current;
    const becameEnabled = previousNextDisabled === true && nextDisabled === false;
    const autoAdvanceAllowedStep =
      stepIndex === 0 || stepIndex === 1 || stepIndex === 2 || stepIndex === 3;
    const canAutoAdvanceNow =
      isDappTutorial &&
      isOnStepPath &&
      !isLastStep &&
      autoAdvanceAllowedStep &&
      !autoAdvancedOnCurrentStepRef.current;
    if (becameEnabled && canAutoAdvanceNow) {
      autoAdvancedOnCurrentStepRef.current = true;
      previousNextDisabledRef.current = nextDisabled;
      goToStep(stepIndex + 1, stepIndex);
      return;
    }
    previousNextDisabledRef.current = nextDisabled;
  }, [goToStep, isDappTutorial, isLastStep, isOnStepPath, nextDisabled, stepIndex]);

  if (!isDappTutorial) {
    return null;
  }

  return (
    <>
      <div className="quickstart-tour-overlay" aria-hidden />
      {hasTargetRect ? (
        <div className="quickstart-tour-spotlight" style={spotlightStyle} aria-hidden />
      ) : null}
      <aside className="quickstart-tour-panel" aria-live="polite" aria-label="Quick start tutorial">
        <p className="quickstart-tour-step">
          Step {stepIndex + 1} of {DAPP_TUTORIAL_STEPS.length}
        </p>
        <h3>{currentStep.title}</h3>
        <p>{currentStep.body}</p>
        {!isOnStepPath ? (
          <button
            type="button"
            className="button button-secondary button-block"
            onClick={() => goToStep(stepIndex)}
          >
            Go to {currentStep.path}
          </button>
        ) : null}
        {isOnStepPath && searchingTarget ? (
          <p className="quickstart-tour-help">Searching for the highlighted target...</p>
        ) : null}
        {isOnStepPath && !searchingTarget && !hasTargetRect ? (
          <p className="quickstart-tour-help">
            Could not find the target element on this page.
          </p>
        ) : null}
        {stepIndex === 0 && walletCheckCompleted && !isWalletConnected ? (
          <p className="quickstart-tour-help">
            Connect your wallet in the highlighted area to enable Next.
          </p>
        ) : null}
        {stepIndex === 1 && createModalCheckCompleted && !isCreateCommunityModalOpen ? (
          <p className="quickstart-tour-help">
            Click Create New Community and wait for the modal to appear to enable Next.
          </p>
        ) : null}
        {stepIndex === 2 &&
        registrationFormCheckCompleted &&
        !isRegistrationFormReady ? (
          <p className="quickstart-tour-help">
            Complete required fields: Service Name and at least one Contract Address.
          </p>
        ) : null}
        {stepIndex === 3 &&
        communityCreatedCheckCompleted &&
        !isCommunityCreated ? (
          <p className="quickstart-tour-help">
            Register Community successfully to enable Next.
          </p>
        ) : null}
        <button
          type="button"
          className="button button-block"
          disabled={nextDisabled}
          onClick={() => {
            if (isLastStep) {
              closeTutorial();
              return;
            }
            if (!canAdvance) {
              return;
            }
            goToStep(stepIndex + 1);
          }}
        >
          {isLastStep ? "Finish" : "Next"}
        </button>
        <button
          type="button"
          className="button button-secondary button-block"
          onClick={closeTutorial}
        >
          Exit Tutorial
        </button>
      </aside>
    </>
  );
}
