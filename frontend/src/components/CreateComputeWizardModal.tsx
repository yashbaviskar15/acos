import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Check, ChevronRight, ChevronLeft, Server, 
  Zap, AlertCircle, Moon, Clock, RefreshCw
} from 'lucide-react';

interface CreateComputeWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: ComputeConfig) => Promise<void>;
  loading?: boolean;
}

export interface ComputeConfig {
  name: string;
  environment: 'development' | 'staging' | 'production';
  instanceType: string;
  osImage: string;
  region: string;
  diskGb: number;
  vpcSubnet: string;
  assignPublicIp: boolean;
  autoSuspend: boolean;
  suspendMinutes: number;
  sshKeyName: string;
}

const STEPS = [
  { id: 1, name: 'Basic Config' },
  { id: 2, name: 'Compute & Disk' },
  { id: 3, name: 'Networking' },
  { id: 4, name: 'Security & Auto' },
  { id: 5, name: 'Review & Launch' },
];

const INSTANCE_SPECS: Record<string, { cpu: number; ram: number; priceMonthly: number }> = {
  'arv.micro': { cpu: 1, ram: 1024, priceMonthly: 350 },
  'arv.small': { cpu: 2, ram: 2048, priceMonthly: 700 },
  'arv.medium': { cpu: 2, ram: 4096, priceMonthly: 1400 },
  'arv.large': { cpu: 4, ram: 8192, priceMonthly: 2800 },
  'arv.xlarge': { cpu: 8, ram: 16384, priceMonthly: 5600 },
};

export const CreateComputeWizardModal: React.FC<CreateComputeWizardModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('development');
  const [instanceType, setInstanceType] = useState('arv.medium');
  const [osImage, setOsImage] = useState('Ubuntu 22.04 LTS');
  const [region, setRegion] = useState('arv-us-east-1');
  const [diskGb, setDiskGb] = useState(50);
  const [vpcSubnet, setVpcSubnet] = useState('subnet-default-1a (10.240.0.0/24)');
  const [assignPublicIp, setAssignPublicIp] = useState(true);
  const [autoSuspend, setAutoSuspend] = useState(true);
  const [suspendMinutes, setSuspendMinutes] = useState(30);
  const [sshKeyName, setSshKeyName] = useState('default-cloud-key');

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrorMsg('');
      setName(`vm-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [isOpen]);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const calculateCost = () => {
    const spec = INSTANCE_SPECS[instanceType] || INSTANCE_SPECS['arv.medium'];
    const diskCost = diskGb * 4;
    const fullMonthly = spec.priceMonthly + diskCost;
    const effectiveMonthly = autoSuspend && environment !== 'production' ? Math.round(fullMonthly * 0.38) : fullMonthly;
    return { fullMonthly, effectiveMonthly };
  };

  const validateStep = (step: number): boolean => {
    setErrorMsg('');
    if (step === 1) {
      if (!name.trim()) {
        setErrorMsg('Instance name is required.');
        return false;
      }
      if (!/^[a-zA-Z0-9-]+$/.test(name.trim())) {
        setErrorMsg('Name must contain only alphanumeric characters and hyphens.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(5, prev + 1));
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    try {
      await onSubmit({
        name: name.trim(),
        environment,
        instanceType,
        osImage,
        region,
        diskGb,
        vpcSubnet,
        assignPublicIp,
        autoSuspend,
        suspendMinutes,
        sshKeyName,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to provision instance. Please try again.');
    }
  };

  return createPortal(
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget && !loading) onClose();
        }}
      >
        <div 
          className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Provision Compute Instance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Step-by-step infrastructure provisioning wizard
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Bar */}
          <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-x-auto gap-2">
            {STEPS.map((s) => (
              <div key={s.id} className="flex items-center gap-2 shrink-0">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    currentStep === s.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : currentStep > s.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {currentStep > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${
                  currentStep === s.id ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500'
                }`}>
                  {s.name}
                </span>
                {s.id < STEPS.length && <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />}
              </div>
            ))}
          </div>

          {/* Form Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: Basic Configuration */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Instance Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. web-api-prod-01"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Unique identifier within this cloud project.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Environment Stage
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['development', 'staging', 'production'] as const).map((env) => (
                      <button
                        key={env}
                        type="button"
                        onClick={() => {
                          setEnvironment(env);
                          setAutoSuspend(env !== 'production');
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                          environment === env
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {env}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cloud Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="arv-us-east-1">arv-us-east-1 (N. Virginia — Low Latency)</option>
                    <option value="arv-in-central-1">arv-in-central-1 (Mumbai — India-First)</option>
                    <option value="arv-eu-west-1">arv-eu-west-1 (Frankfurt — GDPR)</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: Compute Resources & Storage */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Instance Size & Spec
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(INSTANCE_SPECS).map(([typeKey, spec]) => (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => setInstanceType(typeKey)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          instanceType === typeKey
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="flex justify-between items-center font-bold text-xs">
                          <span>{typeKey}</span>
                          <span className="font-mono">₹{spec.priceMonthly}/mo</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {spec.cpu} vCPU • {spec.ram / 1024} GB RAM
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Operating System Image
                  </label>
                  <select
                    value={osImage}
                    onChange={(e) => setOsImage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Ubuntu 22.04 LTS">Ubuntu 22.04 LTS (Recommended)</option>
                    <option value="Debian 12 Bookworm">Debian 12 Bookworm</option>
                    <option value="Alpine Linux 3.19">Alpine Linux 3.19 (Minimal)</option>
                    <option value="RHEL 9 Enterprise">Red Hat Enterprise Linux 9</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>NVMe SSD Storage</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">{diskGb} GB</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={500}
                    step={10}
                    value={diskGb}
                    onChange={(e) => setDiskGb(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>20 GB</span>
                    <span>500 GB</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Networking */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Virtual VPC Subnet
                  </label>
                  <select
                    value={vpcSubnet}
                    onChange={(e) => setVpcSubnet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="subnet-default-1a (10.240.0.0/24)">subnet-default-1a (10.240.0.0/24 — Primary)</option>
                    <option value="subnet-dmz-1b (10.240.1.0/24)">subnet-dmz-1b (10.240.1.0/24 — Isolated)</option>
                  </select>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Auto-Assign Public IPv4 Address
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Allows internet egress and inbound web traffic via security group rules.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={assignPublicIp}
                    onChange={(e) => setAssignPublicIp(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Security & Auto-Suspend */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    SSH Key Pair
                  </label>
                  <select
                    value={sshKeyName}
                    onChange={(e) => setSshKeyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="default-cloud-key">default-cloud-key (ED25519 — Workspace Default)</option>
                    <option value="yash-dev-key">yash-dev-key (RSA 4096)</option>
                  </select>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Non-Prod Auto-Suspend
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoSuspend}
                      onChange={(e) => setAutoSuspend(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Suspends CPU cores after inactivity to reduce operational expenditure by up to 62%.
                  </p>
                  {autoSuspend && (
                    <div className="flex items-center gap-2 pt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-bold">Timer:</span>
                      <select
                        value={suspendMinutes}
                        onChange={(e) => setSuspendMinutes(Number(e.target.value))}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes (Recommended)</option>
                        <option value={60}>1 hour</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: Review & Cost Estimate */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500">Instance Name:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500">Spec / Size:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {instanceType} ({INSTANCE_SPECS[instanceType]?.cpu} vCPU, {INSTANCE_SPECS[instanceType]?.ram / 1024} GB RAM)
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500">OS Image:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{osImage}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500">Storage:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{diskGb} GB NVMe</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500">Region & Subnet:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{region} • 10.240.0.0/24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Auto-Suspend:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {autoSuspend ? `Enabled (${suspendMinutes}m)` : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Live Cost Calculation */}
                <div className="p-4 bg-gradient-to-br from-blue-500/5 via-slate-50 dark:via-slate-900 to-slate-100 dark:to-slate-950 border border-blue-500/20 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> All-In Estimated Monthly Cost
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      100 GB Egress Included
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      ₹{calculateCost().effectiveMonthly.toLocaleString()}/mo
                    </span>
                    {autoSuspend && environment !== 'production' && (
                      <span className="text-[11px] text-slate-400 line-through font-mono">
                        ₹{calculateCost().fullMonthly.toLocaleString()}/mo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                Next Step <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Provisioning Instance...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Launch Instance</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>,
    document.body
  );
};
