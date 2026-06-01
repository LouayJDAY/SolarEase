import { Check } from "lucide-react";
import { motion } from "motion/react";

export type ProjectStep =
  | "STUDY"
  | "VALIDATION"
  | "INSTALLATION"
  | "COMMISSIONING"
  | "COMPLETED";

interface Step {
  id: ProjectStep;
  label: string;
  description: string;
}

interface ProjectStepperProps {
  currentStep: ProjectStep;
  completedSteps?: ProjectStep[];
}

const steps: Step[] = [
  {
    id: "STUDY",
    label: "Étude",
    description: "Analyse de faisabilité",
  },
  {
    id: "VALIDATION",
    label: "Validation",
    description: "Signature du contrat",
  },
  {
    id: "INSTALLATION",
    label: "Installation",
    description: "Pose des équipements",
  },
  {
    id: "COMMISSIONING",
    label: "Mise en service",
    description: "Tests et activation",
  },
  {
    id: "COMPLETED",
    label: "Terminé",
    description: "Projet finalisé",
  },
];

export function ProjectStepper({ currentStep, completedSteps = [] }: ProjectStepperProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  const isStepCompleted = (stepId: ProjectStep) => {
    return completedSteps.includes(stepId);
  };

  const isStepCurrent = (stepId: ProjectStep) => {
    return stepId === currentStep;
  };

  const isStepFuture = (index: number) => {
    return index > currentIndex;
  };

  return (
    <div className="w-full py-8">
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const completed = isStepCompleted(step.id);
            const current = isStepCurrent(step.id);

            return (
              <div key={step.id} className="contents">
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="relative"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        completed
                          ? "bg-primary border-primary text-white"
                          : current
                          ? "bg-white border-primary text-primary"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      {completed ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <span className="font-semibold">{index + 1}</span>
                      )}
                    </div>
                    {current && (
                      <motion.div
                        className="absolute -inset-1 rounded-full border-2 border-primary"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 0 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                    )}
                  </motion.div>
                  <div className="mt-3 text-center">
                    <p
                      className={`text-sm font-medium ${
                        completed || current ? "text-secondary" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex-1 -mt-16 px-4">
                    <div className="relative">
                      <div className="h-0.5 bg-gray-200">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: "0%" }}
                          animate={{ width: index < currentIndex ? "100%" : "0%" }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const completed = isStepCompleted(step.id);
          const current = isStepCurrent(step.id);

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-start space-x-4"
            >
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                    completed
                      ? "bg-primary border-primary text-white"
                      : current
                      ? "bg-white border-primary text-primary"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-12 mt-2 ${index < currentIndex ? "bg-primary" : "bg-gray-200"}`} />
                )}
              </div>
              <div className="flex-1 pt-1">
                <p className={`font-medium ${completed || current ? "text-secondary" : "text-gray-400"}`}>
                  {step.label}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
