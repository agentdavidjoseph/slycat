# Copyright 2013, Sandia Corporation. Under the terms of Contract
# DE-AC04-94AL85000 with Sandia Corporation, the U.S. Government retains certain
# rights in this software.

import numpy
import slycat.web.client
import sys

parser = slycat.web.client.option_parser()
parser.add_option("--column-prefix", default="a", help="Column prefix.  Default: %default")
parser.add_option("--duplicate-input-count", type="int", default=0, help="Number of input columns to duplicate.  Default: %default")
parser.add_option("--duplicate-output-count", type="int", default=0, help="Number of output columns to duplicate.  Default: %default")
parser.add_option("--input-count", type="int", default=3, help="Input column count.  Default: %default")
parser.add_option("--marking", default="", help="Marking type.  Default: %default")
parser.add_option("--model-name", default="Demo CCA Model", help="New model name.  Default: %default")
parser.add_option("--output-count", type="int", default=3, help="Output column count.  Default: %default")
parser.add_option("--project-name", default="Demo CCA Project", help="New project name.  Default: %default")
parser.add_option("--row-count", type="int", default=100, help="Row count.  Default: %default")
parser.add_option("--seed", type="int", default=12345, help="Random seed.  Default: %default")
parser.add_option("--unused-count", type="int", default=3, help="Unused column count.  Default: %default")
options, arguments = parser.parse_args()

if options.input_count < 1:
  raise Exception("Input count must be greater-than zero.")
if options.output_count < 1:
  raise Exception("Output count must be greater-than zero.")
if options.duplicate_input_count >= options.input_count:
  raise Exception("Duplicate input count must be less than input count.")
if options.duplicate_output_count >= options.output_count:
  raise Exception("Duplicate output count must be less than output count.")

total_columns = options.input_count + options.output_count + options.unused_count

# Create some random data using a gaussian distribution ...
numpy.random.seed(options.seed)
data = numpy.random.normal(size=(options.row_count, total_columns))

# Force a somewhat-linear relationship between the inputs and outputs ...
for i in range(options.input_count, options.input_count + min(options.input_count, options.output_count)):
  data[:, i] = data[:, 0] ** i

# Optionally duplicate some columns to create rank-deficient data ...
for i in range(1, 1 + options.duplicate_input_count):
  data[:,i] = data[:,0]
for i in range(1 + options.input_count, 1 + options.input_count + options.duplicate_output_count):
  data[:,i] = data[:, options.input_count]

attributes = [("%s%s" % (options.column_prefix, column), "float64") for column in range(total_columns)]
dimensions = [("row", "int64", 0, options.row_count)]

connection = slycat.web.client.connect(options)
pid = connection.create_project(options.project_name)
mid = connection.create_model(pid, "cca", options.model_name, options.marking)
connection.start_array_set(mid, "data-table")
connection.start_array(mid, "data-table", 0, attributes, dimensions)

for i in range(total_columns):
  connection.store_array_attribute(mid, "data-table", 0, i, data.T[i])

connection.set_parameter(mid, "input-columns", range(0, options.input_count))
connection.set_parameter(mid, "output-columns", range(options.input_count, options.input_count + options.output_count))
connection.set_parameter(mid, "scale-inputs", False)
connection.finish_model(mid)
sys.stderr.write("Your new model is located at %s/models/%s\n" % (options.host, mid))
