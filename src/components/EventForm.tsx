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
  isEditModeState,
  isModalOpenState,
  isTransitioningState,
  modalPositionState,
  selectedEventState,
  timestampClickedState,
} from '../state/atoms';
import { validateEventForm } from '../utils/validation';
import { getOptimalModalPlacement } from '../utils/ui';
import dayjs from 'dayjs';
import { createEvent, updateEvent, deleteEvent } from '../api/eventService';
import { useQueryClient } from '@tanstack/react-query';

const { Title } = Typography;
const FORM_WIDTH = 350; // Increased width of the form
const FORM_MARGIN = 15; // Margin from the cell
const ANIMATION_DURATION = 300; // Animation duration in ms
const DEFAULT_EVENT_TYPE = 'work';

const EventForm: React.FC = () => {
  // Recoil state
  const [isModalOpen, setIsModalOpen] = useRecoilState(isModalOpenState);
  const [modalPosition, setModalPosition] = useRecoilState(modalPositionState);
  const [selectedEvent, setSelectedEvent] = useRecoilState(selectedEventState);
  const setIsEditMode = useSetRecoilState(isEditModeState);
  const [isTransitioning, setIsTransitioning] = useRecoilState(isTransitioningState);
  const [timestampClicked, setTimestampClicked] = useRecoilState(timestampClickedState);

  // Query client for refetching data after mutations
  const queryClient = useQueryClient();

  // Local state
  const [form] = Form.useForm();
  const formRef = useRef<HTMLDivElement>(null);
  const [formPosition, setFormPosition] = useState({ top: 0, left: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change the input ref type
  const inputRef = useRef<InputRef>(null);

  const isMultiDay = Form.useWatch(['isMultiDay'], form);

  useEffect(() => {
    form.setFieldsValue({
      isMultiDay: false,
      type: DEFAULT_EVENT_TYPE,
      name: '',
      startTimestamp: dayjs(timestampClicked),
      endTimestamp: dayjs(timestampClicked).add(1, 'hour'),
      date: dayjs(timestampClicked),
    });
  }, [timestampClicked, form]);

  // Calculate form position whenever modalPosition changes
  useEffect(() => {
    if (modalPosition && formRef.current) {
      const formHeight = formRef.current.offsetHeight || 300;
      const placement = getOptimalModalPlacement(
        modalPosition,
        { width: FORM_WIDTH, height: formHeight },
        FORM_MARGIN
      );

      if (placement.top === formPosition.top && placement.left === formPosition.left) return;

      // Apply transition effect when repositioning
      if (isModalOpen && !isTransitioning) {
        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), ANIMATION_DURATION);
      }

      setFormPosition(placement);
    }
  }, [formPosition, modalPosition, isModalOpen, setIsTransitioning, isTransitioning]);

  // Update the form when the selected event changes
  useEffect(() => {
    if (selectedEvent) {
      const date = selectedEvent.startTimestamp ? dayjs(selectedEvent.startTimestamp) : undefined;

      form.setFieldsValue({
        date,
        name: selectedEvent.name,
        isMultiDay: !!selectedEvent.isMultiDay,
        startTimestamp: selectedEvent.startTimestamp
          ? dayjs(selectedEvent.startTimestamp)
          : undefined,
        endTimestamp: selectedEvent.endTimestamp ? dayjs(selectedEvent.endTimestamp) : undefined,
        type: selectedEvent.type || undefined,
      });
    }
  }, [selectedEvent, form]);

  // Add a useEffect to focus the input when the modal opens or when the form data changes
  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [selectedEvent, isModalOpen]);

  const resetForm = () => {
    form.setFieldsValue({
      isMultiDay: false,
      name: '',
      type: DEFAULT_EVENT_TYPE,
      startTimestamp: undefined,
      endTimestamp: undefined,
    });
    setSelectedEvent(null);
    setIsEditMode(false);
    setIsModalOpen(false);
    setModalPosition(null);
    setTimestampClicked(dayjs().valueOf());
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      const errors = validateEventForm(form.getFieldsValue());

      // Combine date and time for non-multi-day events
      const values = form.getFieldsValue();

      if (!values.isMultiDay) {
        values.startTimestamp = dayjs(values.date)
          .hour(values.startTimestamp.hour())
          .minute(0)
          .second(0)
          .millisecond(0);

        values.endTimestamp = dayjs(values.date)
          .hour(values.endTimestamp.hour())
          .minute(0)
          .second(0)
          .millisecond(0);
      }

      if (errors.length > 0) {
        errors.forEach(err => message.error(err));
        return;
      }

      setIsSubmitting(true);

      // Prepare complete event data
      const eventData = {
        ...values,
        id: selectedEvent?.id, // Ensure ID is included for updates
        type: values.type || DEFAULT_EVENT_TYPE, // Default to work if type not specified
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
              <Form.Item
                name="startTimestamp"
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 12 }}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="Start date"
                  suffixIcon={<CalendarOutlined />}
                  getPopupContainer={trigger => trigger.parentElement || document.body}
                  onChange={date => {
                    form.setFieldsValue({
                      startTimestamp: date,
                    });
                  }}
                />
              </Form.Item>
              <Form.Item
                name="endTimestamp"
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 12 }}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="End date"
                  suffixIcon={<CalendarOutlined />}
                  getPopupContainer={trigger => trigger.parentElement || document.body}
                  onChange={date => {
                    form.setFieldsValue({
                      endTimestamp: date,
                    });
                  }}
                />
              </Form.Item>
            </>
          ) : (
            <>
              {/* Single-day event form */}
              <Form.Item name="date" label="Date" style={{ marginBottom: 16 }} required>
                <DatePicker
                  className="w-full"
                  format="YYYY-MM-DD"
                  placeholder="Select date"
                  suffixIcon={<CalendarOutlined />}
                  getPopupContainer={trigger => trigger.parentElement || document.body}
                  onChange={date => {
                    form.setFieldsValue({
                      date,
                    });
                  }}
                />
              </Form.Item>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item
                  name="startTimestamp"
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
                  />
                </Form.Item>

                <Form.Item
                  name="endTimestamp"
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
