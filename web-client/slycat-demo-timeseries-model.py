# Copyright 2013, Sandia Corporation. Under the terms of Contract
# DE-AC04-94AL85000 with Sandia Corporation, the U.S. Government retains certain
# rights in this software.

"""Demonstrates uploading data to Slycat Web Server to compute a Timeseries Model.

This script computes a Slycat timeseries model using a collection of timeseries
generated by summing sine waves with random coefficients.  Use this script as a
starting-point for uploading your own data to a timeseries model.

A Slycat timeseries model requires the following data, which you will have to
provide in your own scripts:

   inputs                     A single 1D array containing M input observations with N features (array attributes).
   outputs                    A set of M 1D arrays, each containing one time variable and V output variables (array attributes).
   cluster-bin-count          The number of bins for downsampling each timeseries.
   cluster-bin-type           The algorithm used for downsampling.  Currently "naive" is the only allowed value.
   cluster-type               The algorithm used for clustering.  Allowed values are "single", "complete", "average", and "weighted".
"""

import numpy
import slycat.web.client
import sys

parser = slycat.web.client.option_parser()
parser.add_option("--cluster-bin-count", type="int", default=500, help="Cluster bin count.  Default: %default")
parser.add_option("--cluster-bin-type", default="naive", help="Cluster bin type.  Default: %default")
parser.add_option("--cluster-type", default="average", help="Clustering type.  Default: %default")
parser.add_option("--input-variable-prefix", default="a", help="Input variable prefix.  Default: %default")
parser.add_option("--marking", default="", help="Marking type.  Default: %default")
parser.add_option("--model-name", default="Demo Timeseries Model", help="New model name.  Default: %default")
parser.add_option("--output-variable-count", type="int", default=2, help="Number of output variables in each timeseries.  Default: %default")
parser.add_option("--output-variable-prefix", default="b", help="Output variable prefix.  Default: %default")
parser.add_option("--project-name", default="Demo Timeseries Project", help="New project name.  Default: %default")
parser.add_option("--seed", type="int", default=12345, help="Random seed.  Default: %default")
parser.add_option("--timeseries-count", type="int", default=10, help="Number of timeseries.  Default: %default")
parser.add_option("--timeseries-samples", type="int", default=15000, help="Number of samples in each timeseries.  Default: %default")
parser.add_option("--timeseries-waves", type="int", default=4, help="Number of random sine waves to sum for each timeseries.  Default: %default")
options, arguments = parser.parse_args()

numpy.random.seed(options.seed)

# Generate a set of random coefficients that we'll use later to synthesize our timeseries.
inputs = numpy.hstack([numpy.sort(numpy.random.random((options.timeseries_count, options.timeseries_waves)) * 8 + 1) for output_variable in range(options.output_variable_count)])

# Setup a connection to the Slycat Web Server.
connection = slycat.web.client.connect(options)

# Create a new project to contain our model.
pid = connection.create_project(options.project_name)

# Create the new, empty model.
mid = connection.create_model(pid, "timeseries", options.model_name, options.marking)

# Upload our coefficients as "inputs".
input_attributes = [("%s%s" % (options.input_variable_prefix, attribute), "float64") for attribute in range(inputs.shape[1])]
input_dimensions = [("row", "int64", 0, inputs.shape[0])]

connection.start_array_set(mid, "inputs")
connection.start_array(mid, "inputs", 0, input_attributes, input_dimensions)
for attribute, data in enumerate(inputs.T):
  connection.store_array_attribute(mid, "inputs", 0, attribute, data)

# Upload a collection of timeseries as "outputs".
connection.start_array_set(mid, "outputs")
for timeseries in range(options.timeseries_count):
  sys.stderr.write("Timeseries {}.\n".format(timeseries))
  timeseries_attributes = [("time", "float64")] + [("%s%s" % (options.output_variable_prefix, attribute), "float64") for attribute in range(options.output_variable_count)]
  timeseries_dimensions = [("row", "int64", 0, options.timeseries_samples)]
  connection.start_array(mid, "outputs", timeseries, timeseries_attributes, timeseries_dimensions)

  sys.stderr.write("  Uploading times.\n")
  times = numpy.linspace(0, 2 * numpy.pi, options.timeseries_samples)
  connection.store_array_attribute(mid, "outputs", timeseries, 0, times)

  for variable in range(options.output_variable_count):
    sys.stderr.write("  Uploading variable {}.\n".format(variable))
    coefficients = inputs[timeseries, variable * options.timeseries_waves : (variable+1) * options.timeseries_waves]
    values = numpy.zeros((options.timeseries_samples))
    for k in coefficients:
      values += numpy.sin(times * k) / k
    connection.store_array_attribute(mid, "outputs", timeseries, variable + 1, values)

# Store the remaining parameters.
connection.store_parameter(mid, "cluster-bin-count", options.cluster_bin_count)
connection.store_parameter(mid, "cluster-bin-type", options.cluster_bin_type)
connection.store_parameter(mid, "cluster-type", options.cluster_type)

# Signal that we're done uploading data to the model.  This lets Slycat Web
# Server know that it can start computation.
connection.finish_model(mid)
# Wait until the model is ready.
connection.join_model(mid)

# Supply the user with a direct link to the new model.
sys.stderr.write("Your new model is located at %s/models/%s\n" % (options.host, mid))
