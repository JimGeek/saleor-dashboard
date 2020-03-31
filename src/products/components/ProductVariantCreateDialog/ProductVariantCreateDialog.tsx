import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import { FormattedMessage } from "react-intl";

import useModalDialogErrors from "@saleor/hooks/useModalDialogErrors";
import useModalDialogOpen from "@saleor/hooks/useModalDialogOpen";
import useWizard from "@saleor/hooks/useWizard";
import { ProductVariantBulkCreateInput } from "../../../types/globalTypes";
import { createInitialForm, ProductVariantCreateFormData } from "./form";
import ProductVariantCreateContent, {
  ProductVariantCreateContentProps
} from "./ProductVariantCreateContent";
import reduceProductVariantCreateFormData from "./reducer";
import { ProductVariantCreateStep } from "./types";

const useStyles = makeStyles(
  theme => ({
    button: {
      marginLeft: theme.spacing(2)
    },
    content: {
      overflowX: "visible",
      overflowY: "hidden",
      width: 800
    },
    spacer: {
      flex: 1
    }
  }),
  { name: "ProductVariantCreateDialog" }
);

function canHitNext(
  step: ProductVariantCreateStep,
  data: ProductVariantCreateFormData
): boolean {
  switch (step) {
    case ProductVariantCreateStep.values:
      return data.attributes.every(attribute => attribute.values.length > 0);
    case ProductVariantCreateStep.prices:
      if (data.price.all) {
        if (data.price.value === "") {
          return false;
        }
      } else {
        if (
          data.price.attribute === "" ||
          data.price.values.some(attributeValue => attributeValue.value === "")
        ) {
          return false;
        }
      }

      if (data.stock.all) {
        if (data.stock.value === "") {
          return false;
        }
      } else {
        if (
          data.stock.attribute === "" ||
          data.stock.values.some(attributeValue => attributeValue.value === "")
        ) {
          return false;
        }
      }

      return true;
    case ProductVariantCreateStep.summary:
      return data.variants.every(variant => variant.sku !== "");

    default:
      return false;
  }
}

export interface ProductVariantCreateDialogProps
  extends Omit<
    ProductVariantCreateContentProps,
    "data" | "dispatchFormDataAction" | "step" | "onStepClick"
  > {
  defaultPrice: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProductVariantBulkCreateInput[]) => void;
}

const ProductVariantCreateDialog: React.FC<ProductVariantCreateDialogProps> = props => {
  const {
    attributes,
    defaultPrice,
    errors: apiErrors,
    open,
    onClose,
    onSubmit,
    ...contentProps
  } = props;
  const classes = useStyles(props);
  const [step, { next, prev, set: setStep }] = useWizard<
    ProductVariantCreateStep
  >(ProductVariantCreateStep.values, [
    ProductVariantCreateStep.values,
    ProductVariantCreateStep.prices,
    ProductVariantCreateStep.summary
  ]);

  const [data, dispatchFormDataAction] = React.useReducer(
    reduceProductVariantCreateFormData,
    createInitialForm(attributes, defaultPrice)
  );

  const reloadForm = () =>
    dispatchFormDataAction({
      data: createInitialForm(attributes, defaultPrice),
      type: "reload"
    });

  React.useEffect(reloadForm, [attributes.length]);

  useModalDialogOpen(open, {
    onClose: () => {
      reloadForm();
      setStep(ProductVariantCreateStep.values);
    }
  });

  const errors = useModalDialogErrors(apiErrors, open);

  return (
    <Dialog open={open} maxWidth="md">
      <DialogTitle>
        <FormattedMessage
          defaultMessage="Assign Attribute"
          description="dialog header"
        />
      </DialogTitle>
      <DialogContent className={classes.content}>
        <ProductVariantCreateContent
          {...contentProps}
          attributes={attributes}
          data={data}
          dispatchFormDataAction={dispatchFormDataAction}
          errors={errors}
          step={step}
          onStepClick={step => setStep(step)}
        />
      </DialogContent>
      <DialogActions>
        <Button className={classes.button} onClick={onClose}>
          <FormattedMessage defaultMessage="Cancel" description="button" />
        </Button>
        <div className={classes.spacer} />
        {step !== ProductVariantCreateStep.values && (
          <Button className={classes.button} color="primary" onClick={prev}>
            <FormattedMessage
              defaultMessage="Previous"
              description="previous step, button"
            />
          </Button>
        )}
        {step !== ProductVariantCreateStep.summary ? (
          <Button
            className={classes.button}
            color="primary"
            disabled={!canHitNext(step, data)}
            variant="contained"
            onClick={next}
          >
            <FormattedMessage defaultMessage="Next" description="button" />
          </Button>
        ) : (
          <Button
            className={classes.button}
            color="primary"
            disabled={!canHitNext(step, data)}
            variant="contained"
            onClick={() => onSubmit(data.variants)}
          >
            <FormattedMessage
              defaultMessage="Create"
              description="create multiple variants, button"
            />
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

ProductVariantCreateDialog.displayName = "ProductVariantCreateDialog";
export default ProductVariantCreateDialog;
