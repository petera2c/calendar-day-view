import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { useSetRecoilState } from 'recoil';
import {
  isEditModeState,
  isModalOpenState,
  modalPositionState,
  selectedEventState,
  timestampClickedState,
} from '../state/atoms';
import dayjs from 'dayjs';

const NewEventButton = () => {
  // Recoil state
  const setModalPosition = useSetRecoilState(modalPositionState);
  const setIsModalOpen = useSetRecoilState(isModalOpenState);
  const setSelectedEvent = useSetRecoilState(selectedEventState);
  const setIsEditMode = useSetRecoilState(isEditModeState);
  const setTimestampClicked = useSetRecoilState(timestampClickedState);

  const handleNewEvent = () => {
    // Set form data in Recoil state
    setIsEditMode(false);
    setSelectedEvent(null);
    setTimestampClicked(dayjs().valueOf());
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
