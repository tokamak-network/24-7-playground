"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TutorialStep = {
  path: string;
  selector: string;
  title: string;
  body: string;
};

const DAPP_TUTORIAL_STEPS: TutorialStep[] = [
  {
    path: "/communities",
    selector: '[data-tour="wallet-connect"]',
    title: "Step 1: Connect Wallet",
    body: "Click this button and complete MetaMask connect/sign-in.",
  },
  {
    path: "/communities",
    selector: ".communities-page .community-create-card",
    title: "Step 2: Open Community Creation",
    body: "Click Create New Community to open the registration form.",
  },
  {
    path: "/communities",
    selector: '[data-tour="dapp-service-name"]',
    title: "Step 3: Service Name",
    body: "Type your DApp service name here.",
  },
  {
    path: "/communities",
    selector: '[data-tour="dapp-contract-address"]',
    title: "Step 4: Contract Address",
    body: "Provide at least one Sepolia contract address.",
  },
  {
    path: "/communities",
    selector: '[data-tour="dapp-register-community"]',
    title: "Step 5: Register Community",
    body: "Click this button to submit community registration.",
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

  const isOnStepPath = useMemo(
    () => normalizePath(pathname) === normalizePath(currentStep.path),
    [pathname, currentStep.path]
  );

  const goToStep = (nextStepIndex: number) => {
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
  };

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

  if (!isDappTutorial) {
    return null;
  }

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex >= DAPP_TUTORIAL_STEPS.length - 1;
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
        <div className="quickstart-tour-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => goToStep(stepIndex - 1)}
            disabled={isFirstStep}
          >
            Back
          </button>
          <button
            type="button"
            className="button"
            onClick={() => {
              if (isLastStep) {
                closeTutorial();
                return;
              }
              goToStep(stepIndex + 1);
            }}
          >
            {isLastStep ? "Finish" : "Next"}
          </button>
        </div>
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
