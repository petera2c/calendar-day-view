import React, { useEffect, useRef, useState } from 'react';
import {
  Form,
  Input,
  Button,
  TimePicker,
  message,
  Space,
  Checkbox,
  DatePicker,
  Typography,
  Card,
  Select,
  InputRef,
} from 'antd';
import { DeleteOutlined, CloseOutlined, CalendarOutlined } from '@ant-design/icons';
import { useRecoilState, useSetRecoilState } from 'recoil';
import {
  formDataState,
  isEditModeState,
  isModalOpenState,
  isTransitioningState,
  modalPositionState,
  selectedEventState,
} from '../state/atoms';
import { validateEventForm } from '../utils/validation';
import { getOptimalModalPlacement } from '../utils/ui';
import dayjs from 'dayjs';
import { Event } from '../types/event';
import { createEvent, updateEvent, deleteEvent } from '../api/eventService';
import { useQueryClient } from '@tanstack/react-query';

const { Title } = Typography;
const FORM_WIDTH = 350; // Increased width of the form
const FORM_MARGIN = 15; // Margin from the cell
const ANIMATION_DURATION = 300; // Animation duration in ms

interface EventFormProps {
  events: Event[];
}

const EventForm: React.FC<EventFormProps> = ({ events }) => {
  // Recoil state
  const [isModalOpen, setIsModalOpen] = useRecoilState(isModalOpenState);
  const [formData, setFormData] = useRecoilState(formDataState);
  const [modalPosition, setModalPosition] = useRecoilState(modalPositionState);
  const [selectedEventId, setSelectedEventId] = useRecoilState(selectedEventState);
  const setIsEditMode = useSetRecoilState(isEditModeState);
  const [isTransitioning, setIsTransitioning] = useRecoilState(isTransitioningState);

  // Query client for refetching data after mutations
  const queryClient = useQueryClient();

  // Local state
  const [form] = Form.useForm();
  const formRef = useRef<HTMLDivElement>(null);
  const [formPosition, setFormPosition] = useState({ top: 0, left: 0 });
  const [isMultiDay, setIsMultiDay] = useState(!!formData.isMultiDay);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change the input ref type
  const inputRef = useRef<InputRef>(null);

  // Get the selected event from the events array
  const selectedEvent = events.find(event => event.id === selectedEventId) || null;

  const getDateFromTimestamp = (timestamp?: number): dayjs.Dayjs | undefined => {
    if (!timestamp) return undefined;
    return dayjs(timestamp);
  };

  // Direct time change handler - updates immediately without OK button
  const handleTimeChange = (field: 'startTime' | 'endTime', value: dayjs.Dayjs | null) => {
    if (!value) return;

    const currentDate =
      field === 'startTime'
        ? formData.startTimestamp
          ? dayjs(formData.startTimestamp)
          : dayjs().startOf('day')
        : formData.endTimestamp
        ? dayjs(formData.endTimestamp)
        : dayjs().startOf('day');

    const newTimestamp = currentDate
      .hour(value.hour())
      .minute(0) // always set minutes to 0 for hour-only selection
      .second(0)
      .millisecond(0)
      .valueOf();

    setFormData({
      ...formData,
      [field === 'startTime' ? 'startTimestamp' : 'endTimestamp']: newTimestamp,
    });
  };

  // Direct date change handler - updates immediately without OK button
  const handleDateChange = (field: 'startDate' | 'endDate', value: dayjs.Dayjs | null) => {
    if (!value) return;

    const timeRef =
      field === 'startDate'
        ? formData.startTimestamp
          ? dayjs(formData.startTimestamp)
          : dayjs().hour(9)
        : formData.endTimestamp
        ? dayjs(formData.endTimestamp)
        : dayjs().hour(17);

    const newTimestamp = value.hour(timeRef.hour()).minute(0).second(0).millisecond(0).valueOf();

    setFormData({
      ...formData,
      [field === 'startDate' ? 'startTimestamp' : 'endTimestamp']: newTimestamp,
    });
  };

  // Calculate form position whenever modalPosition changes
  useEffect(() => {
    if (modalPosition && formRef.current) {
      const formHeight = formRef.current.offsetHeight || 300;
      const placement = getOptimalModalPlacement(
        modalPosition,
        { width: FORM_WIDTH, height: formHeight },
        FORM_MARGIN
      );

      // Apply transition effect when repositioning
      if (isModalOpen && !isTransitioning) {
        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), ANIMATION_DURATION);
      }

      setFormPosition(placement);
    }
  }, [modalPosition, isModalOpen, setIsTransitioning, isTransitioning]);

  // Update the form when the selected event changes
  useEffect(() => {
    setIsMultiDay(!!formData.isMultiDay);

    form.setFieldsValue({
      name: formData.name,
      startTime: formData.startTimestamp ? dayjs(formData.startTimestamp) : undefined,
      endTime: formData.endTimestamp ? dayjs(formData.endTimestamp) : undefined,
      isMultiDay: !!formData.isMultiDay,
      startDate: getDateFromTimestamp(formData.startTimestamp),
      endDate: getDateFromTimestamp(formData.endTimestamp),
      type: formData.type || undefined,
    });
  }, [formData, form]);

  // Add a useEffect to focus the input when the modal opens
  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [formData, isModalOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      startTimestamp: undefined,
      endTimestamp: undefined,
    });
    setSelectedEventId(null);
    setIsEditMode(false);
    setIsModalOpen(false);
    setModalPosition(null);
  };

  const handleFormChange = (changedValues: any) => {
    // Handle multi-day checkbox toggle
    if ('isMultiDay' in changedValues) {
      setIsMultiDay(changedValues.isMultiDay);

      // If toggling to multi-day, set default end date
      if (changedValues.isMultiDay && !formData.endTimestamp) {
        const startDate = formData.startTimestamp
          ? dayjs(formData.startTimestamp)
          : dayjs().startOf('day');
        const endDate = startDate.add(1, 'day');

        form.setFieldsValue({
          endDate: endDate,
        });

        setFormData({
          ...formData,
          isMultiDay: true,
          endTimestamp: endDate.valueOf(),
        });
        return;
      }

      // If toggling off multi-day, remove end date
      if (!changedValues.isMultiDay) {
        form.setFieldsValue({
          endDate: undefined,
        });

        const updatedData = { ...formData, isMultiDay: false };
        setFormData(updatedData);
        return;
      }
    }

    // Handle date changes
    if ('startDate' in changedValues && changedValues.startDate) {
      let newStartTimestamp: number;

      // Preserve the time from the existing timestamp if available
      if (formData.startTimestamp) {
        const existingTime = dayjs(formData.startTimestamp);
        newStartTimestamp = changedValues.startDate
          .hour(existingTime.hour())
          .minute(existingTime.minute())
          .second(0)
          .millisecond(0)
          .valueOf();
      } else {
        // Default to start of day if no time exists
        newStartTimestamp = changedValues.startDate
          .hour(9) // Default to 9 AM
          .minute(0)
          .second(0)
          .millisecond(0)
          .valueOf();
      }

      setFormData({
        ...formData,
        startTimestamp: newStartTimestamp,
      });
      return;
    }

    if ('endDate' in changedValues && changedValues.endDate) {
      let newEndTimestamp: number;

      // Preserve the time from the existing timestamp if available
      if (formData.endTimestamp) {
        const existingTime = dayjs(formData.endTimestamp);
        newEndTimestamp = changedValues.endDate
          .hour(existingTime.hour())
          .minute(existingTime.minute())
          .second(0)
          .millisecond(0)
          .valueOf();
      } else {
        // Default to end of day if no time exists
        newEndTimestamp = changedValues.endDate
          .hour(17) // Default to 5 PM
          .minute(0)
          .second(0)
          .millisecond(0)
          .valueOf();
      }

      setFormData({
        ...formData,
        endTimestamp: newEndTimestamp,
      });
      return;
    }

    // Handle time changes
    if ('startTime' in changedValues && changedValues.startTime) {
      const currentDate = formData.startTimestamp
        ? dayjs(formData.startTimestamp)
        : dayjs().startOf('day');

      const newStartTimestamp = currentDate
        .hour(changedValues.startTime.hour())
        .minute(changedValues.startTime.minute())
        .second(0)
        .millisecond(0)
        .valueOf();

      setFormData({
        ...formData,
        startTimestamp: newStartTimestamp,
      });
      return;
    }

    if ('endTime' in changedValues && changedValues.endTime) {
      const currentDate = formData.endTimestamp
        ? dayjs(formData.endTimestamp)
        : formData.startTimestamp
        ? dayjs(formData.startTimestamp)
        : dayjs().startOf('day');

      const newEndTimestamp = currentDate
        .hour(changedValues.endTime.hour())
        .minute(changedValues.endTime.minute())
        .second(0)
        .millisecond(0)
        .valueOf();

      setFormData({
        ...formData,
        endTimestamp: newEndTimestamp,
      });
      return;
    }

    // Handle event type change
    if ('type' in changedValues) {
      setFormData({
        ...formData,
        type: changedValues.type,
      });
      return;
    }

    // Handle normal field changes
    setFormData({
      ...formData,
      ...changedValues,
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      const errors = validateEventForm(formData);
      if (errors.length > 0) {
        errors.forEach(err => message.error(err));
        return;
      }

      setIsSubmitting(true);

      // Prepare complete event data
      const eventData = {
        ...formData,
        id: selectedEvent?.id, // Ensure ID is included for updates
        type: formData.type || 'work', // Default to work if type not specified
      };

      // Either update or create event
      if (selectedEvent) {
        await updateEvent(eventData);
        message.success('Event updated successfully');
      } else {
        await createEvent(eventData);
        message.success('Event created successfully');
      }

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['events'] });

      resetForm();
    } catch (err) {
      console.error(err);
      message.error('An error occurred while saving the event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (selectedEvent) {
      try {
        setIsSubmitting(true);
        await deleteEvent(selectedEvent.id);
        message.success('Event deleted successfully');

        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ['events'] });

        resetForm();
      } catch (err) {
        console.error(err);
        message.error('An error occurred while deleting the event');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  // Calculate form styles based on calculated position and animation state
  const getFormStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      top: `${formPosition.top}px`,
      left: `${formPosition.left}px`,
      transform: 'translate(0, -50%)',
      zIndex: 1000,
      width: `${FORM_WIDTH}px`,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      opacity: isModalOpen ? 1 : 0,
      pointerEvents: isModalOpen ? 'auto' : 'none',
      transition: `opacity ${ANIMATION_DURATION}ms ease, 
                  top ${ANIMATION_DURATION}ms ease, 
                  left ${ANIMATION_DURATION}ms ease`,
      borderRadius: '8px',
    };

    return baseStyle;
  };

  // Event type options
  const eventTypeOptions = [
    { label: 'Work', value: 'work' },
    { label: 'Personal', value: 'personal' },
    { label: 'Meeting', value: 'meeting' },
    { label: 'Social', value: 'social' },
    { label: 'Health', value: 'health' },
    { label: 'Travel', value: 'travel' },
    { label: 'Education', value: 'education' },
  ];

  return (
    <div ref={formRef} style={getFormStyle()}>
      <Card
        title={
          <div className="flex justify-between items-center">
            <Title level={5} style={{ margin: 0 }}>
              {selectedEvent ? 'Edit Event' : 'New Event'}
            </Title>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleCancel}
              aria-label="Close form"
            />
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          size="middle"
          initialValues={formData}
          onValuesChange={handleFormChange}
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item name="name" rules={[{ required: true, message: 'Please enter event name' }]}>
            <Input placeholder="Event name" ref={inputRef} className="font-medium" />
          </Form.Item>

          <Form.Item name="type" style={{ marginBottom: 12 }}>
            <Select
              placeholder="Select event type"
              options={eventTypeOptions}
              style={{ width: '100%' }}
              getPopupContainer={trigger => trigger.parentElement || document.body}
            />
          </Form.Item>

          <Form.Item name="isMultiDay" valuePropName="checked" style={{ marginBottom: 16 }}>
            <Checkbox>Multi-day event</Checkbox>
          </Form.Item>

          {isMultiDay ? (
            <>
              {/* Multi-day event form */}
              <div className="grid grid-cols-2 gap-3">
                <Form.Item
                  name="startDate"
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ marginBottom: 12 }}
                >
                  <DatePicker
                    format="YYYY-MM-DD"
                    style={{ width: '100%' }}
                    placeholder="Start date"
                    suffixIcon={<CalendarOutlined />}
                    getPopupContainer={trigger => trigger.parentElement || document.body}
                    onChange={date => handleDateChange('startDate', date)}
                  />
                </Form.Item>

                <Form.Item
                  name="startTime"
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ marginBottom: 12 }}
                >
                  <TimePicker
                    use12Hours
                    format="h A"
                    style={{ width: '100%' }}
                    placeholder="Start time"
                    hourStep={1}
                    showNow={false}
                    showMinute={false}
                    showSecond={false}
                    onChange={time => handleTimeChange('startTime', time)}
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item
                  name="endDate"
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ marginBottom: 16 }}
                >
                  <DatePicker
                    format="YYYY-MM-DD"
                    style={{ width: '100%' }}
                    placeholder="End date"
                    suffixIcon={<CalendarOutlined />}
                    getPopupContainer={trigger => trigger.parentElement || document.body}
                    onChange={date => handleDateChange('endDate', date)}
                  />
                </Form.Item>

                <Form.Item
                  name="endTime"
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ marginBottom: 16 }}
                >
                  <TimePicker
                    use12Hours
                    format="h A"
                    style={{ width: '100%' }}
                    placeholder="End time"
                    hourStep={1}
                    showNow={false}
                    showMinute={false}
                    showSecond={false}
                    onChange={time => handleTimeChange('endTime', time)}
                  />
                </Form.Item>
              </div>
            </>
          ) : (
            <>
              {/* Single-day event form */}
              <div className="grid grid-cols-2 gap-3">
                <Form.Item
                  name="startTime"
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ marginBottom: 16 }}
                >
                  <TimePicker
                    use12Hours
                    format="h A"
                    style={{ width: '100%' }}
                    placeholder="Start time"
                    hourStep={1}
                    showNow={false}
                    showMinute={false}
                    showSecond={false}
                    onChange={time => handleTimeChange('startTime', time)}
                  />
                </Form.Item>

                <Form.Item
                  name="endTime"
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ marginBottom: 16 }}
                >
                  <TimePicker
                    use12Hours
                    format="h A"
                    style={{ width: '100%' }}
                    placeholder="End time"
                    hourStep={1}
                    showNow={false}
                    showMinute={false}
                    showSecond={false}
                    onChange={time => handleTimeChange('endTime', time)}
                  />
                </Form.Item>
              </div>
            </>
          )}

          <div className="flex justify-between pt-2">
            <div>
              {selectedEvent && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  loading={isSubmitting}
                  size="middle"
                >
                  Delete
                </Button>
              )}
            </div>
            <Space>
              <Button onClick={handleCancel} size="middle">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting} size="middle">
                {selectedEvent ? 'Update' : 'Create'}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default EventForm;
