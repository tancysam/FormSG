import { FormProvider, useForm, UseFormReturn } from 'react-hook-form'
import { composeStories } from '@storybook/react-vite'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { BasicField } from 'formsg-shared/types'

import { REQUIRED_ERROR } from '~constants/validation'

import { CheckboxFieldSchema } from '../types'

import { CheckboxField } from './CheckboxField'
import * as stories from './CheckboxField.stories'
import {
  CHECKBOX_OTHERS_INPUT_KEY,
  CHECKBOX_OTHERS_INPUT_VALUE,
} from './constants'

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

  it('renders success when checkbox fields are selected when submitted (without others option)', async () => {
    // Arrange
    const user = userEvent.setup()
    const checkboxOptions = WithoutOthersOption.args?.schema?.fieldOptions
    const checkboxOptionsToSelect = [
      checkboxOptions?.[0],
      checkboxOptions?.[2],
    ] as string[]

    render(<WithoutOthersOption />)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    // Act
    await act(async () =>
      checkboxOptionsToSelect.forEach((optionVal) =>
        user.click(screen.getByLabelText(optionVal)),
      ),
    )
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(
      screen.getByText(JSON.stringify(checkboxOptionsToSelect), {
        exact: false,
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument()
  })

  it('renders success when valid radio field selected when submitted (with others option)', async () => {
    // Arrange
    const user = userEvent.setup()
    const checkboxOption =
      ValidationRequired.args?.schema?.fieldOptions?.[0] ?? ''
    render(<ValidationRequired />)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const firstCheckboxButton = screen.getByLabelText(checkboxOption)

    // Act
    await user.click(firstCheckboxButton)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(
      screen.getByText(
        `{"value":["${checkboxOption}"],"${CHECKBOX_OTHERS_INPUT_KEY}":""}`,
        {
          exact: false,
        },
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
    const checkboxOption =
      ValidationOptional.args?.schema?.fieldOptions?.[3] ?? ''
    render(<ValidationOptional />)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const firstCheckboxButton = screen.getByLabelText(checkboxOption)

    // Act
    await user.click(firstCheckboxButton)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(
      screen.getByText(
        `{"value":["${checkboxOption}"],"${CHECKBOX_OTHERS_INPUT_KEY}":""}`,
        {
          exact: false,
        },
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument()
  })
})

describe('radio validation', () => {
  it('renders error when others option is checked without filling in input after submission', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const otherCheckboxOption = screen.getByRole('checkbox', { name: /other/i })

    // Act
    await user.click(otherCheckboxOption)
    await user.click(submitButton)

    // Assert
    // Should show specific other required error message.
    expect(
      screen.getByText(/Please specify a value for the "others" option/i),
    ).toBeInTheDocument()
  })

  it('disables the "Others" input when an option other than "Others" is checked', async () => {
    // Arrange
    const user = userEvent.setup()
    const checkboxOptionLabel =
      ValidationRequired.args?.schema?.fieldOptions?.[0]
    if (!checkboxOptionLabel) {
      throw new Error(
        'Test setup: ValidationRequired story must define at least one field option',
      )
    }
    render(<ValidationRequired />)
    const othersInput = screen.getByLabelText('"Other" response')
    const checkboxOption = screen.getByLabelText(checkboxOptionLabel)

    // Assert
    // Initially nothing is selected, so the input stays editable to allow
    // typing to auto-select the "Others" option.
    expect(othersInput).toBeEnabled()

    // Act
    // Check a non-"Others" option.
    await user.click(checkboxOption)

    // Assert
    // "Others" input should now be greyed out (disabled) to signal that its
    // content will not be submitted unless "Others" is also checked.
    expect(othersInput).toBeDisabled()
  })

  it('renders the "Others" input as a single-line input when the field is enabled', () => {
    // Arrange
    setupCheckboxField(
      { ...disabledOthersSchema, disabled: false },
      {
        [disabledOthersSchema._id]: {
          value: [CHECKBOX_OTHERS_INPUT_VALUE],
          othersInput: 'some answer',
        },
      },
    )

    // Assert
    const control = screen.getByRole('textbox', { name: '"Other" response' })
    expect(control.tagName).toBe('INPUT')
  })

  it('checks the "Others" option when typing into the "Others" input', async () => {
    // Arrange
    const user = userEvent.setup()
    setupCheckboxField({ ...disabledOthersSchema, disabled: false })
    const othersInput = screen.getByRole('textbox', {
      name: '"Other" response',
    })
    const othersCheckbox = screen.getByRole('checkbox', { name: /other/i })
    expect(othersCheckbox).not.toBeChecked()

    // Act
    await user.type(othersInput, 'a custom answer')

    // Assert
    expect(othersCheckbox).toBeChecked()
  })

  it('keeps the same "Others" input node across transient disabled states', async () => {
    // Arrange
    const user = userEvent.setup()
    setupCheckboxField({ ...disabledOthersSchema, disabled: false })
    const othersCheckbox = screen.getByRole('checkbox', { name: /other/i })
    const altCheckbox = screen.getByRole('checkbox', { name: 'apple' })

    // Act
    // Check "Others" and type a custom answer.
    await user.click(othersCheckbox)
    const othersInput = screen.getByRole('textbox', {
      name: '"Other" response',
    })
    await user.type(othersInput, 'My custom answer')
    // Check a different option and uncheck "Others".
    await user.click(altCheckbox)
    await user.click(othersCheckbox)

    // Assert
    // "Others" input is greyed out but is the same DOM node.
    const disabledInput = screen.getByRole('textbox', {
      name: '"Other" response',
    })
    expect(disabledInput).toBeDisabled()
    expect(disabledInput).toBe(othersInput)

    // Act
    // Re-check "Others".
    await user.click(othersCheckbox)

    // Assert
    // Same input is enabled and retains its value. The focus-on-change in
    // `OthersCheckbox` is a no-op while the input is still disabled, so click
    // into the input to assert it is focusable again.
    expect(othersInput).toBeEnabled()
    expect(othersInput).toHaveValue('My custom answer')
    await user.click(othersInput)
    expect(othersInput).toHaveFocus()
  })

  it('renders success when unchecking some options before submitting', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)
    const checkboxOptionLabel =
      ValidationOptional.args?.schema?.fieldOptions?.[3] ?? ''

    const submitButton = screen.getByRole('button', { name: /submit/i })
    const checkboxOption = screen.getByLabelText(checkboxOptionLabel)
    const otherCheckboxOption = screen.getByRole('checkbox', { name: /other/i })

    // Act
    await user.click(otherCheckboxOption)
    await user.click(checkboxOption)
    // Uncheck other option.
    await user.click(otherCheckboxOption)
    await user.click(submitButton)

    // Assert
    // Should show success message with only 1 checkbox option.
    expect(
      screen.getByText(
        `{"value":["${checkboxOptionLabel}"],"${CHECKBOX_OTHERS_INPUT_KEY}":""}`,
        { exact: false },
      ),
    ).toBeInTheDocument()
    // Other required error message should not be shown.
    expect(
      screen.queryByText(/Please specify a value for the "others" option/i),
    ).not.toBeInTheDocument()
  })
})

const disabledOthersSchema: CheckboxFieldSchema = {
  othersRadioButton: true,
  validateByValue: false,
  ValidationOptions: {
    customMax: null,
    customMin: null,
  },
  fieldOptions: ['apple', 'pear', 'orange', 'durian'],
  title: 'Favourite fruit',
  description: '',
  required: false,
  disabled: true,
  fieldType: BasicField.Checkbox,
  _id: '9051-disabled-checkbox-field',
}

const LONG_OTHERS_ANSWER = 'a very long prior-step answer '.repeat(25)

const setupCheckboxField = (
  schema: CheckboxFieldSchema,
  defaultValues?: Record<string, unknown>,
) => {
  const formRef: { current: UseFormReturn | null } = { current: null }
  const Wrapper = () => {
    const formMethods = useForm({ defaultValues })
    formRef.current = formMethods
    return (
      <FormProvider {...formMethods}>
        <CheckboxField schema={schema} />
      </FormProvider>
    )
  }
  render(<Wrapper />)
  return formRef
}

describe('disabled field with prior-step "Others" answer', () => {
  it('renders the "Others" answer in a disabled textarea', () => {
    // Arrange
    setupCheckboxField(disabledOthersSchema, {
      [disabledOthersSchema._id]: {
        value: [CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: LONG_OTHERS_ANSWER,
      },
    })

    // Assert
    const control = screen.getByRole('textbox', { name: '"Other" response' })
    expect(control.tagName).toBe('TEXTAREA')
    expect(control).toBeDisabled()
    expect(control).toHaveValue(LONG_OTHERS_ANSWER)
    expect(screen.getByRole('checkbox', { name: /other/i })).toBeChecked()
  })

  it('updates the textarea when the form is reset with a prior-step answer', async () => {
    // Arrange
    const formRef = setupCheckboxField(disabledOthersSchema)
    const control = screen.getByRole('textbox', { name: '"Other" response' })
    expect(control.tagName).toBe('TEXTAREA')

    // Act
    await act(async () => {
      formRef.current?.reset({
        [disabledOthersSchema._id]: {
          value: [CHECKBOX_OTHERS_INPUT_VALUE],
          othersInput: LONG_OTHERS_ANSWER,
        },
      })
    })

    // Assert
    await waitFor(() => expect(control).toHaveValue(LONG_OTHERS_ANSWER))
    expect(screen.getByRole('checkbox', { name: /other/i })).toBeChecked()
  })
})
