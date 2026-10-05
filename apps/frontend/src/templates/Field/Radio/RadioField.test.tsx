import { FormProvider, useForm, UseFormReturn } from 'react-hook-form'
import { composeStories } from '@storybook/react-vite'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { BasicField } from 'formsg-shared/types'

import { REQUIRED_ERROR } from '~constants/validation'

import { RadioFieldSchema } from '../types'

import { RADIO_OTHERS_INPUT_KEY, RADIO_OTHERS_INPUT_VALUE } from './constants'
import { RadioField } from './RadioField'
import * as stories from './RadioField.stories'

const { ValidationOptional, ValidationRequired, WithoutOthersOption } =
  composeStories(stories)

describe('required field', () => {
  it('renders error when field is not selected before submitting', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)
    const submitButton = screen.getByRole('button', { name: /submit/i })

    // Act
    await user.click(submitButton)

    // Assert
    // Should show error message.
    expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument()
  })

  it('renders success when valid radio field selected when submitted (without others option)', async () => {
    // Arrange
    const user = userEvent.setup()
    const radioOption =
      WithoutOthersOption.args?.schema?.fieldOptions?.[0] ?? ''
    render(<WithoutOthersOption />)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const firstRadioButton = screen.getByLabelText(radioOption)

    // Act
    await user.click(firstRadioButton)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(
      screen.getByText(new RegExp(`{"value":"${radioOption}"}`, 'i')),
    ).toBeInTheDocument()
    expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument()
  })

  it('renders success when valid radio field selected when submitted (with others option)', async () => {
    // Arrange
    const user = userEvent.setup()
    const radioOption = ValidationRequired.args?.schema?.fieldOptions?.[0] ?? ''
    render(<ValidationRequired />)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const firstRadioButton = screen.getByLabelText(radioOption)

    // Act
    await user.click(firstRadioButton)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(
      screen.getByText(
        new RegExp(
          `{"value":"${radioOption}","${RADIO_OTHERS_INPUT_KEY}":""}`,
          'i',
        ),
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument()
  })
})

describe('optional field', () => {
  it('renders success even when field is not selected before submitting', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationOptional />)
    const submitButton = screen.getByRole('button', { name: /submit/i })

    // Act
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(screen.getByText(/you have submitted/i)).toBeInTheDocument()
  })

  it('renders success when valid radio field selected when submitted', async () => {
    // Arrange
    const user = userEvent.setup()
    const radioOption = ValidationOptional.args?.schema?.fieldOptions?.[3] ?? ''
    render(<ValidationOptional />)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const firstRadioButton = screen.getByLabelText(radioOption)

    // Act
    await user.click(firstRadioButton)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(
      screen.getByText(
        new RegExp(
          `{"value":"${radioOption}","${RADIO_OTHERS_INPUT_KEY}":""}`,
          'i',
        ),
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument()
  })
})

describe('radio validation', () => {
  it('renders error when others option is submitted without filling in input', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const otherRadioButton = screen.getByRole('radio', { name: /other/i })

    // Act
    await user.click(otherRadioButton)
    await user.click(submitButton)

    // Assert
    // Should show specific other required error message.
    expect(
      screen.getByText(/Please specify a value for the "others" option/i),
    ).toBeInTheDocument()
  })

  it('disables the "Others" input when another option is selected', async () => {
    // Arrange
    const user = userEvent.setup()
    const radioOption = ValidationRequired.args?.schema?.fieldOptions?.[0]
    if (!radioOption) {
      throw new Error(
        'Test setup: ValidationRequired story must define at least one field option',
      )
    }
    render(<ValidationRequired />)
    const othersInput = screen.getByLabelText('"Other" response')
    const otherRadioButton = screen.getByRole('radio', { name: /other/i })
    const altRadioButton = screen.getByLabelText(radioOption)

    // Act
    // Select "Others" and type a custom answer; input should be editable.
    await user.click(otherRadioButton)
    await user.type(othersInput, 'My custom answer')
    expect(othersInput).toBeEnabled()
    // Switch to a different option.
    await user.click(altRadioButton)

    // Assert
    // "Others" input should now be greyed out (disabled) to signal that its
    // content will not be submitted.
    expect(othersInput).toBeDisabled()
  })

  it('renders the "Others" input as a single-line input when the field is enabled', () => {
    // Arrange
    setupRadioField(
      { ...disabledOthersSchema, disabled: false },
      {
        [disabledOthersSchema._id]: {
          value: RADIO_OTHERS_INPUT_VALUE,
          othersInput: 'some answer',
        },
      },
    )

    // Assert
    const control = screen.getByRole('textbox', { name: '"Other" response' })
    expect(control.tagName).toBe('INPUT')
  })

  it('selects the "Others" option when typing into the "Others" input', async () => {
    // Arrange
    const user = userEvent.setup()
    setupRadioField({ ...disabledOthersSchema, disabled: false })
    const othersInput = screen.getByRole('textbox', {
      name: '"Other" response',
    })
    const othersRadio = screen.getByRole('radio', { name: /other/i })
    expect(othersRadio).not.toBeChecked()

    // Act
    await user.type(othersInput, 'a custom answer')

    // Assert
    expect(othersRadio).toBeChecked()
  })

  it('keeps the same "Others" input node across transient disabled states', async () => {
    // Arrange
    const user = userEvent.setup()
    setupRadioField({ ...disabledOthersSchema, disabled: false })
    const othersRadio = screen.getByRole('radio', { name: /other/i })
    const altRadio = screen.getByRole('radio', { name: 'apple' })

    // Act
    // Select "Others" and type a custom answer.
    await user.click(othersRadio)
    const othersInput = screen.getByRole('textbox', {
      name: '"Other" response',
    })
    await user.type(othersInput, 'My custom answer')
    // Switch to a different option.
    await user.click(altRadio)

    // Assert
    // "Others" input is greyed out but is the same DOM node.
    const disabledInput = screen.getByRole('textbox', {
      name: '"Other" response',
    })
    expect(disabledInput).toBeDisabled()
    expect(disabledInput).toBe(othersInput)

    // Act
    // Re-select "Others".
    await user.click(othersRadio)

    // Assert
    // Same input is enabled, focused, and retains its value.
    expect(othersInput).toBeEnabled()
    expect(othersInput).toHaveFocus()
    expect(othersInput).toHaveValue('My custom answer')
  })

  it('renders success when switching options before submitting', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)
    const radioOption = ValidationOptional.args?.schema?.fieldOptions?.[3] ?? ''

    const submitButton = screen.getByRole('button', { name: /submit/i })
    const altRadioButton = screen.getByLabelText(radioOption)
    const otherRadioButton = screen.getByRole('radio', { name: /other/i })

    // Act
    await user.click(otherRadioButton)
    // Change radio option
    await user.click(altRadioButton)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(
      screen.getByText(
        new RegExp(
          `{"value":"${radioOption}","${RADIO_OTHERS_INPUT_KEY}":""}`,
          'i',
        ),
      ),
    ).toBeInTheDocument()
    // Other required error message should not be shown.
    expect(
      screen.queryByText(/Please specify a value for the "others" option/i),
    ).not.toBeInTheDocument()
  })
})

const disabledOthersSchema: RadioFieldSchema = {
  othersRadioButton: true,
  fieldOptions: ['apple', 'pear', 'orange', 'durian'],
  title: 'Favourite fruit',
  description: '',
  required: false,
  disabled: true,
  fieldType: BasicField.Radio,
  _id: '9051-disabled-radio-field',
}

const LONG_OTHERS_ANSWER = 'a very long prior-step answer '.repeat(25)

const setupRadioField = (
  schema: RadioFieldSchema,
  defaultValues?: Record<string, unknown>,
) => {
  const formRef: { current: UseFormReturn | null } = { current: null }
  const Wrapper = () => {
    const formMethods = useForm({ defaultValues })
    formRef.current = formMethods
    return (
      <FormProvider {...formMethods}>
        <RadioField schema={schema} />
      </FormProvider>
    )
  }
  render(<Wrapper />)
  return formRef
}

describe('disabled field with prior-step "Others" answer', () => {
  it('renders the "Others" answer in a disabled textarea', () => {
    // Arrange
    setupRadioField(disabledOthersSchema, {
      [disabledOthersSchema._id]: {
        value: RADIO_OTHERS_INPUT_VALUE,
        othersInput: LONG_OTHERS_ANSWER,
      },
    })

    // Assert
    const control = screen.getByRole('textbox', { name: '"Other" response' })
    expect(control.tagName).toBe('TEXTAREA')
    expect(control).toBeDisabled()
    expect(control).toHaveValue(LONG_OTHERS_ANSWER)
    expect(screen.getByRole('radio', { name: /other/i })).toBeChecked()
  })

  it('updates the textarea when the form is reset with a prior-step answer', async () => {
    // Arrange
    const formRef = setupRadioField(disabledOthersSchema)
    const control = screen.getByRole('textbox', { name: '"Other" response' })
    expect(control.tagName).toBe('TEXTAREA')

    // Act
    await act(async () => {
      formRef.current?.reset({
        [disabledOthersSchema._id]: {
          value: RADIO_OTHERS_INPUT_VALUE,
          othersInput: LONG_OTHERS_ANSWER,
        },
      })
    })

    // Assert
    await waitFor(() => expect(control).toHaveValue(LONG_OTHERS_ANSWER))
    expect(screen.getByRole('radio', { name: /other/i })).toBeChecked()
  })
})
