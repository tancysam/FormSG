import { Meta, StoryFn } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { expect, waitFor, within } from 'storybook/test'

import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { FormResponseMode, WorkflowType } from 'formsg-shared/types'
import {
  BasicField,
  CheckboxFieldBase,
  FormFieldDto,
  RadioFieldBase,
} from 'formsg-shared/types/field'

import { TABLE_FIELD_ADDITIONAL_ROWS_FIELD } from '~/mocks/msw/handlers/admin-form'
import { envHandlers } from '~/mocks/msw/handlers/env'
import {
  getEncryptedSubmissionResponse,
  getPublicFormResponse,
  postGenerateVfnOtpResponse,
  postVerifyVfnOtpResponse,
  postVfnTransactionResponse,
} from '~/mocks/msw/handlers/public-form'

import {
  _getFromIndexedDBForTest,
  _removeFromIndexedDBForTest,
} from '~hooks/useIndexedDb'
import { getMobileViewParameters, StoryRouter } from '~utils/storybook'

import { SAVE_DRAFT_INDEXEDDB_STORE_NAME } from '~features/form/constants'

import { DraftSubmission } from './PublicFormContext'
import PublicFormPage from './PublicFormPage'
import SaveDraftSetupWrapper from './SaveDraftSetupWrapper'

const DEFAULT_MSW_HANDLERS = [
  ...envHandlers,
  getPublicFormResponse(),
  postVfnTransactionResponse(),
  postGenerateVfnOtpResponse(),
  postVerifyVfnOtpResponse(),
  getEncryptedSubmissionResponse(),
]

export default {
  title: 'Pages/PublicFormPageMrfSubsequentSteps',
  component: PublicFormPage,
  decorators: [
    StoryRouter({
      initialEntries: [
        `/61540ece3d4a6e50ac0cc6ff/edit/68d4b9900415e65225fd3e4e?key=mock-key`,
      ],
      path: '/:formId/edit/:submissionId',
    }),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: DEFAULT_MSW_HANDLERS,
  },
} as Meta

const Template: StoryFn = () => <PublicFormPage />

const PREVIOUS_SUBMISSION_TABLE_FIELD_WITH_ADDITIONAL_ROWS =
  '{"table-field-for-test-id":{"fieldType":"table","answer":[{"table-field-for-test-id-col-1":"prev submission start 1/3","table-field-for-test-id-col-2":"cool beans"},{"table-field-for-test-id-col-1":"prev submission mid 2/3","table-field-for-test-id-col-2":"see ya later alligator"},{"table-field-for-test-id-col-1":"prev submission end 3/3","table-field-for-test-id-col-2":"far out man"}]}}'

// Only contains 1 row, while the minimum is 2.
const PREVIOUS_SUBMISSION_TABLE_FIELD_WITH_ONE_ROW =
  '{"table-field-for-test-id":{"fieldType":"table","answer":[{"table-field-for-test-id-col-1":"prev submission start and end 1/1","table-field-for-test-id-col-2":"cool beans"}]}}'

export const WithMultiRespondentFormStep2NonEditableTableFieldAdditionalRows =
  Template.bind({})
WithMultiRespondentFormStep2NonEditableTableFieldAdditionalRows.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Multirespondent,
          workflow: [],
        },
      },
    }),
    getEncryptedSubmissionResponse({
      overrides: {
        workflow: [
          {
            _id: 'step-0',
            edit: ['table-field-for-test-id'],
            workflow_type: WorkflowType.Static,
          },
          {
            _id: 'step-1',
            edit: [],
            workflow_type: WorkflowType.Static,
          },
        ],
        form_fields: [TABLE_FIELD_ADDITIONAL_ROWS_FIELD],
        encryptedContent: PREVIOUS_SUBMISSION_TABLE_FIELD_WITH_ADDITIONAL_ROWS,
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}

export const WithMultiRespondentFormStep2EditableTableFieldLessThanMinimumRows =
  Template.bind({})

WithMultiRespondentFormStep2EditableTableFieldLessThanMinimumRows.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Multirespondent,
          workflow: [],
        },
      },
    }),
    getEncryptedSubmissionResponse({
      overrides: {
        workflow: [
          {
            _id: 'step-0',
            edit: ['table-field-for-test-id'],
            workflow_type: WorkflowType.Static,
          },
          {
            _id: 'step-1',
            edit: ['table-field-for-test-id'],
            workflow_type: WorkflowType.Static,
          },
        ],
        form_fields: [TABLE_FIELD_ADDITIONAL_ROWS_FIELD],
        workflowStep: 0,
        encryptedContent: PREVIOUS_SUBMISSION_TABLE_FIELD_WITH_ONE_ROW,
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}

const STEP_2_SAVED_DRAFT_RESPONSES = {
  'table-field-for-test-id': [
    {
      'table-field-for-test-id-col-1': 'this is saved draft 1/4',
      'table-field-for-test-id-col-2': 'cool beans',
    },
    {
      'table-field-for-test-id-col-1': 'this is saved draft 2/4',
      'table-field-for-test-id-col-2': 'cool beans',
    },
    {
      'table-field-for-test-id-col-1': 'this is saved draft 3/4',
      'table-field-for-test-id-col-2': 'cool beans',
    },
    {
      'table-field-for-test-id-col-1': 'this is saved draft 4/4',
      'table-field-for-test-id-col-2': 'cool beans',
    },
  ],
}

const STEP_2_TABLE_FIELD_ONLY_CHECKSUM = {
  'table-field-for-test-id':
    '{"title":"Table field for test","description":"No more table field regressions please","required":true,"disabled":false,"fieldType":"table","_id":"table-field-for-test-id","globalId":"not-used","minimumRows":2,"columns":[{"title":"Short text column","required":true,"columnType":"textfield","ValidationOptions":{"customVal":null,"selectedValidation":null},"_id":"table-field-for-test-id-col-1"},{"title":"Dropdown column","required":true,"columnType":"dropdown","fieldOptions":["cool beans","see ya later alligator","far out man"],"_id":"table-field-for-test-id-col-2"}],"addMoreRows":true,"maximumRows":4}',
}

const MULTIRESPONDENT_MODE_PUBLIC_FORM_STEP_1_SAVE_DRAFT_KEY =
  'formsg-save-draft-61540ece3d4a6e50ac0cc6ff-68d4b9900415e65225fd3e4e-step1'

export const WithMultiRespondentFormStep2NonEditableTableFieldAdditionalRowsWithSaveDraft =
  Template.bind({})

WithMultiRespondentFormStep2NonEditableTableFieldAdditionalRowsWithSaveDraft.parameters =
  {
    docs: {
      storyDescription:
        'This story asserts that the saved draft does not override the previous submission when the table field is non-editabl in the current mrf workflow step',
    },
    msw: [
      getPublicFormResponse({
        overrides: {
          form: {
            responseMode: FormResponseMode.Multirespondent,
            workflow: [],
            isSaveDraftEnabled: true,
          },
        },
      }),
      getEncryptedSubmissionResponse({
        overrides: {
          workflow: [
            {
              _id: 'step-0',
              edit: ['table-field-for-test-id'],
              workflow_type: WorkflowType.Static,
            },
            {
              _id: 'step-1',
              edit: [],
              workflow_type: WorkflowType.Static,
            },
          ],
          form_fields: [TABLE_FIELD_ADDITIONAL_ROWS_FIELD],
          encryptedContent:
            PREVIOUS_SUBMISSION_TABLE_FIELD_WITH_ADDITIONAL_ROWS,
        },
      }),
      ...DEFAULT_MSW_HANDLERS,
    ],
  }

WithMultiRespondentFormStep2NonEditableTableFieldAdditionalRowsWithSaveDraft.decorators =
  [
    (Story) => (
      <SaveDraftSetupWrapper
        draftKey={MULTIRESPONDENT_MODE_PUBLIC_FORM_STEP_1_SAVE_DRAFT_KEY}
        draftValue={{
          lastUpdated: new Date().getTime() - 10,
          draftResponses: STEP_2_SAVED_DRAFT_RESPONSES,
          fieldDefinitionsChecksum: STEP_2_TABLE_FIELD_ONLY_CHECKSUM,
        }}
      >
        <Story />
      </SaveDraftSetupWrapper>
    ),
  ]

WithMultiRespondentFormStep2NonEditableTableFieldAdditionalRowsWithSaveDraft.play =
  async ({ step }) => {
    await step(
      'Assert that the saved draft is created in IndexedDB',
      async () => {
        const savedDraft = (await _getFromIndexedDBForTest({
          key: MULTIRESPONDENT_MODE_PUBLIC_FORM_STEP_1_SAVE_DRAFT_KEY,
          storeName: SAVE_DRAFT_INDEXEDDB_STORE_NAME,
        })) as DraftSubmission | undefined
        expect(savedDraft?.draftResponses).toBeTruthy()
      },
    )

    await step(
      'Assert that the save draft restored toast message appears',
      async () => {
        await waitFor(
          () => {
            expect(document.body).toHaveTextContent(
              'Your draft has been successfully restored.',
            )
          },
          { timeout: 3000 },
        )
      },
    )

    await step('Cleanup saved draft', async () => {
      await _removeFromIndexedDBForTest({
        key: MULTIRESPONDENT_MODE_PUBLIC_FORM_STEP_1_SAVE_DRAFT_KEY,
        storeName: SAVE_DRAFT_INDEXEDDB_STORE_NAME,
      })
    })
  }

export const WithMultiRespondentFormStep2EditableTableFieldAdditionalRowsWithSaveDraft =
  Template.bind({})

WithMultiRespondentFormStep2EditableTableFieldAdditionalRowsWithSaveDraft.parameters =
  {
    docs: {
      storyDescription:
        'This story asserts that the saved draft overrides the previous submission when the table field is editable in the current mrf workflow step',
    },
    msw: [
      getPublicFormResponse({
        overrides: {
          form: {
            responseMode: FormResponseMode.Multirespondent,
            workflow: [],
            isSaveDraftEnabled: true,
          },
        },
      }),
      getEncryptedSubmissionResponse({
        overrides: {
          workflow: [
            {
              _id: 'step-0',
              edit: ['table-field-for-test-id'],
              workflow_type: WorkflowType.Static,
            },
            {
              _id: 'step-1',
              edit: ['table-field-for-test-id'],
              workflow_type: WorkflowType.Static,
            },
          ],
          form_fields: [TABLE_FIELD_ADDITIONAL_ROWS_FIELD],
          encryptedContent:
            PREVIOUS_SUBMISSION_TABLE_FIELD_WITH_ADDITIONAL_ROWS,
        },
      }),
      ...DEFAULT_MSW_HANDLERS,
    ],
  }

WithMultiRespondentFormStep2EditableTableFieldAdditionalRowsWithSaveDraft.decorators =
  [
    (Story) => (
      <SaveDraftSetupWrapper
        draftKey={MULTIRESPONDENT_MODE_PUBLIC_FORM_STEP_1_SAVE_DRAFT_KEY}
        draftValue={{
          lastUpdated: new Date().getTime() - 10,
          draftResponses: STEP_2_SAVED_DRAFT_RESPONSES,
          fieldDefinitionsChecksum: STEP_2_TABLE_FIELD_ONLY_CHECKSUM,
        }}
      >
        <Story />
      </SaveDraftSetupWrapper>
    ),
  ]

WithMultiRespondentFormStep2EditableTableFieldAdditionalRowsWithSaveDraft.play =
  async ({ step }) => {
    await step(
      'Assert that the saved draft is created in IndexedDB',
      async () => {
        const savedDraft = (await _getFromIndexedDBForTest({
          key: MULTIRESPONDENT_MODE_PUBLIC_FORM_STEP_1_SAVE_DRAFT_KEY,
          storeName: SAVE_DRAFT_INDEXEDDB_STORE_NAME,
        })) as DraftSubmission | undefined
        expect(savedDraft?.draftResponses).toBeTruthy()
      },
    )

    await step(
      'Assert that the save draft restored toast message appears',
      async () => {
        await waitFor(
          () => {
            expect(document.body).toHaveTextContent(
              'Your draft has been successfully restored.',
            )
          },
          { timeout: 3000 },
        )
      },
    )

    await step('Cleanup saved draft', async () => {
      await _removeFromIndexedDBForTest({
        key: MULTIRESPONDENT_MODE_PUBLIC_FORM_STEP_1_SAVE_DRAFT_KEY,
        storeName: SAVE_DRAFT_INDEXEDDB_STORE_NAME,
      })
    })
  }

export const WithStoppedWorkflow = Template.bind({})
WithStoppedWorkflow.parameters = {
  msw: [
    http.get('/api/v3/forms/:formId/submissions/:submissionId', () =>
      HttpResponse.json(
        {
          message:
            'This workflow has been stopped. Please contact the form admin that gave you this link.',
          messageKey:
            'features.publicForm.backendErrors.submission.mrf.workflowStopped',
        },
        { status: 400 },
      ),
    ),
    getPublicFormResponse({
      overrides: {
        form: { responseMode: FormResponseMode.Multirespondent },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}
WithStoppedWorkflow.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await waitFor(() =>
    expect(
      canvas.getByText(/This workflow has been stopped/),
    ).toBeInTheDocument(),
  )
}

const RADIO_OTHERS_FIELD: FormFieldDto<RadioFieldBase> = {
  title: 'Radio with Others for test',
  description: 'Long Others answer should be fully readable',
  required: true,
  disabled: false,
  fieldType: BasicField.Radio,
  _id: 'radio-others-field-id',
  globalId: 'not-used',
  othersRadioButton: true,
  fieldOptions: ['alpha', 'beta', 'gamma'],
}

const CHECKBOX_OTHERS_FIELD: FormFieldDto<CheckboxFieldBase> = {
  title: 'Checkbox with Others for test',
  description: 'Long Others answer should be fully readable',
  required: true,
  disabled: false,
  fieldType: BasicField.Checkbox,
  _id: 'checkbox-others-field-id',
  globalId: 'not-used',
  othersRadioButton: true,
  validateByValue: false,
  ValidationOptions: {
    customMax: null,
    customMin: null,
  },
  fieldOptions: ['alpha', 'beta', 'gamma'],
}

// A long multi-paragraph answer well beyond 12 rows of text.
const LONG_RADIO_OTHERS_ANSWER = [
  'This is a very long answer given by the respondent in the previous step of the form. It is intentionally long so that it far exceeds the height of a single-line input and requires multiple rows to display.',
  'The second paragraph continues the answer with even more detail, ensuring that the rendered control must grow well past twelve rows before the entire response is visible without scrolling.',
  'A final short paragraph wraps things up.',
].join('\n\n')

// A long unbroken token with no whitespace.
const LONG_CHECKBOX_OTHERS_ANSWER = 'a'.repeat(300)

const PREVIOUS_SUBMISSION_OTHERS_ANSWERS = JSON.stringify({
  'radio-others-field-id': {
    fieldType: 'radiobutton',
    answer: { value: LONG_RADIO_OTHERS_ANSWER, isOthersInput: true },
    question: 'Radio with Others for test',
    provenance: {},
  },
  'checkbox-others-field-id': {
    fieldType: 'checkbox',
    answer: {
      value: [CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
      othersInput: LONG_CHECKBOX_OTHERS_ANSWER,
    },
    question: 'Checkbox with Others for test',
    provenance: {},
  },
})

const MRF_STEP_2_NON_EDITABLE_OTHERS_FIELDS_MSW = [
  getPublicFormResponse({
    overrides: {
      form: {
        responseMode: FormResponseMode.Multirespondent,
        workflow: [],
      },
    },
  }),
  getEncryptedSubmissionResponse({
    overrides: {
      workflow: [
        {
          _id: 'step-0',
          edit: [RADIO_OTHERS_FIELD._id, CHECKBOX_OTHERS_FIELD._id],
          workflow_type: WorkflowType.Static,
        },
        {
          _id: 'step-1',
          edit: [],
          workflow_type: WorkflowType.Static,
        },
      ],
      form_fields: [RADIO_OTHERS_FIELD, CHECKBOX_OTHERS_FIELD],
      encryptedContent: PREVIOUS_SUBMISSION_OTHERS_ANSWERS,
    },
  }),
  ...DEFAULT_MSW_HANDLERS,
]

const getOthersTextareaWithValue = async (
  canvas: ReturnType<typeof within>,
  expectedValue: string,
) => {
  let match: HTMLTextAreaElement | undefined
  await waitFor(() => {
    const textareas = canvas.getAllByRole('textbox', {
      name: '"Other" response',
    }) as HTMLTextAreaElement[]
    match = textareas.find((t) => t.value === expectedValue)
    expect(match).toBeTruthy()
  })
  return match as HTMLTextAreaElement
}

const waitForStableHeight = async (el: HTMLElement) => {
  await waitFor(async () => {
    const first = el.clientHeight
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(el.clientHeight).toBe(first)
  })
}

const playDisabledOthersFields: StoryFn['play'] = async ({
  canvasElement,
  step,
}) => {
  const canvas = within(canvasElement)

  let radioTextarea: HTMLTextAreaElement | undefined
  let checkboxTextarea: HTMLTextAreaElement | undefined
  await step(
    'Wait for both "Others" textareas to show the prior-step answers',
    async () => {
      radioTextarea = await getOthersTextareaWithValue(
        canvas,
        LONG_RADIO_OTHERS_ANSWER,
      )
      checkboxTextarea = await getOthersTextareaWithValue(
        canvas,
        LONG_CHECKBOX_OTHERS_ANSWER,
      )
    },
  )
  if (!radioTextarea || !checkboxTextarea) {
    throw new Error('"Others" textareas not found')
  }
  const textareas: HTMLTextAreaElement[] = [radioTextarea, checkboxTextarea]

  await step('Both "Others" textareas are visible and have size', async () => {
    for (const textarea of textareas) {
      expect(textarea).toBeVisible()
      expect(textarea.clientWidth).toBeGreaterThan(0)
      expect(textarea.clientHeight).toBeGreaterThan(0)
    }
  })

  await step('Autosize has settled with no clipped content', async () => {
    for (const textarea of textareas) {
      await waitForStableHeight(textarea)
      expect(textarea.scrollHeight).toBeLessThanOrEqual(
        textarea.clientHeight + 1,
      )
      expect(textarea.scrollWidth).toBeLessThanOrEqual(textarea.clientWidth + 1)
    }
  })

  await step('The "Others" options are checked and disabled', async () => {
    const othersRadio = canvas.getByRole('radio', { name: 'Others' })
    expect(othersRadio).toBeChecked()
    expect(othersRadio).toBeDisabled()
    const othersCheckbox = canvas.getByRole('checkbox', { name: 'Others' })
    expect(othersCheckbox).toBeChecked()
    expect(othersCheckbox).toBeDisabled()
  })
}

export const WithMultiRespondentFormStep2NonEditableOthersFields =
  Template.bind({})
WithMultiRespondentFormStep2NonEditableOthersFields.parameters = {
  msw: MRF_STEP_2_NON_EDITABLE_OTHERS_FIELDS_MSW,
}
WithMultiRespondentFormStep2NonEditableOthersFields.play =
  playDisabledOthersFields

export const WithMultiRespondentFormStep2NonEditableOthersFieldsMobile =
  Template.bind({})
WithMultiRespondentFormStep2NonEditableOthersFieldsMobile.parameters = {
  msw: MRF_STEP_2_NON_EDITABLE_OTHERS_FIELDS_MSW,
  ...getMobileViewParameters(),
}
WithMultiRespondentFormStep2NonEditableOthersFieldsMobile.play =
  playDisabledOthersFields
