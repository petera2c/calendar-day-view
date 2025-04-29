import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { useSetRecoilState } from 'recoil';
import {
  formDataState,
  isEditModeState,
  isModalOpenState,
  modalPositionState,
  selectedEventState,
} from '../state/atoms';
import { createDefaultEventData } from '../utils/event';

const NewEventButton = () => {
  // Recoil state
  const setModalPosition = useSetRecoilState(modalPositionState);
  const setFormData = useSetRecoilState(formDataState);
  const setIsModalOpen = useSetRecoilState(isModalOpenState);
  const setSelectedEventId = useSetRecoilState(selectedEventState);
  const setIsEditMode = useSetRecoilState(isEditModeState);

  const handleNewEvent = () => {
    // Create event at current time, rounded to the nearest hour
    const now = new Date();
    const currentHour = now.getHours();

    // Create default event data
    const newEventData = createDefaultEventData(now, currentHour);

    // Set form data in Recoil state
    setFormData(newEventData);
    setIsEditMode(false);
    setSelectedEventId(null);

    // Position in the center of the screen (no cell reference)
    setModalPosition({
      x: 0,
      y: 0,
      // No cellRect - will default to center positioning
    });

    // Open the modal
    setIsModalOpen(true);
  };

  return (
    <Button
      type="primary"
      icon={<FontAwesomeIcon icon={faPlus} className="mr-1" />}
      onClick={handleNewEvent}
      size="middle"
    >
      New Event
    </Button>
  );
};

export default NewEventButton;
