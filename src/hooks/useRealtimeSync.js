import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let unsubStudent, unsubPayment, unsubWaitingList, unsubMeeting, unsubParticipant;

    try {
      unsubStudent = base44.entities.Student.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ["students"] });
        queryClient.invalidateQueries({ queryKey: ["student"] });
        queryClient.invalidateQueries({ queryKey: ["student-receipt"] });
        queryClient.invalidateQueries({ queryKey: ["student-form"] });
      });
    } catch (e) { /* subscription optional */ }

    try {
      unsubPayment = base44.entities.Payment.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ["payments"] });
        queryClient.invalidateQueries({ queryKey: ["payments-receipt"] });
      });
    } catch (e) { /* subscription optional */ }

    try {
      unsubWaitingList = base44.entities.WaitingList.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ["waitingList"] });
      });
    } catch (e) { /* subscription optional */ }

    try {
      unsubMeeting = base44.entities.MeetingSchedule.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
        queryClient.invalidateQueries({ queryKey: ["meeting"] });
      });
    } catch (e) { /* subscription optional */ }

    try {
      unsubParticipant = base44.entities.MeetingParticipant.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ["meeting-participants"] });
      });
    } catch (e) { /* subscription optional */ }

    return () => {
      unsubStudent?.();
      unsubPayment?.();
      unsubWaitingList?.();
      unsubMeeting?.();
      unsubParticipant?.();
    };
  }, [queryClient]);
}