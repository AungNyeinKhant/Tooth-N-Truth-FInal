import { create } from 'zustand';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface AppointmentState {
  // Selection state
  selectedBranch: Branch | null;
  selectedService: Service | null;
  selectedDoctor: Doctor | null;
  selectedDate: Date | null;
  selectedSlot: TimeSlot | null;
  notes: string;

  // Data
  branches: Branch[];
  services: Service[];
  doctors: Doctor[];
  availableSlots: TimeSlot[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setBranch: (branch: Branch | null) => void;
  setService: (service: Service | null) => void;
  setDoctor: (doctor: Doctor | null) => void;
  setDate: (date: Date | null) => void;
  setSlot: (slot: TimeSlot | null) => void;
  setNotes: (notes: string) => void;
  setBranches: (branches: Branch[]) => void;
  setServices: (services: Service[]) => void;
  setDoctors: (doctors: Doctor[]) => void;
  setAvailableSlots: (slots: TimeSlot[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  selectedBranch: null,
  selectedService: null,
  selectedDoctor: null,
  selectedDate: null,
  selectedSlot: null,
  notes: '',
  branches: [],
  services: [],
  doctors: [],
  availableSlots: [],
  isLoading: false,
  error: null,
};

export const useAppointmentStore = create<AppointmentState>((set) => ({
  ...initialState,

  setBranch: (branch) =>
    set({
      selectedBranch: branch,
      selectedDoctor: null,
      selectedDate: null,
      selectedSlot: null,
      doctors: [],
      availableSlots: [],
    }),

  setService: (service) =>
    set({
      selectedService: service,
      selectedDate: null,
      selectedSlot: null,
      availableSlots: [],
    }),

  setDoctor: (doctor) =>
    set({
      selectedDoctor: doctor,
      selectedDate: null,
      selectedSlot: null,
      availableSlots: [],
    }),

  setDate: (date) =>
    set({
      selectedDate: date,
      selectedSlot: null,
      availableSlots: [],
    }),

  setSlot: (slot) => set({ selectedSlot: slot }),
  setNotes: (notes) => set({ notes }),
  setBranches: (branches) => set({ branches }),
  setServices: (services) => set({ services }),
  setDoctors: (doctors) => set({ doctors }),
  setAvailableSlots: (slots) => set({ availableSlots: slots }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
